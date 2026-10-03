import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { repositoryDirectory } from "../config.mjs";

const directory = mkdtempSync(join(tmpdir(), "release-provenance-"));
after(() => rmSync(directory, { recursive: true, force: true }));
const git = (args) =>
  execFileSync("git", args, {
    cwd: directory,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
git(["init", "--initial-branch=main"]);
cpSync(
  join(repositoryDirectory, "scripts/releases"),
  join(directory, "scripts/releases"),
  { recursive: true },
);
cpSync(
  join(repositoryDirectory, "release.config.json"),
  join(directory, "release.config.json"),
);
const configPath = join(directory, "release.config.json");
const fixtureConfig = JSON.parse(readFileSync(configPath, "utf8"));
fixtureConfig.stagingConvexUrl = "https://staging-example.convex.cloud";
fixtureConfig.productionConvexUrl = "https://production-example.convex.cloud";
writeFileSync(configPath, JSON.stringify(fixtureConfig));
const commit = (subject) => {
  git(["add", "."]);
  git([
    "-c",
    "user.name=Release tests",
    "-c",
    "user.email=tests@example.invalid",
    "commit",
    "-m",
    subject,
  ]);
  return git(["rev-parse", "HEAD"]);
};
const older = commit("chore: trusted older main");
writeFileSync(join(directory, "newer"), "main");
const main = commit("chore: trusted main");
git(["update-ref", "refs/remotes/origin/main", main]);
git(["checkout", "-b", "feature"]);
writeFileSync(join(directory, "feature-only"), "not released");
const feature = commit("feat: feature only");
const backend = (sha) =>
  spawnSync(
    process.execPath,
    ["scripts/releases/backend-record.mjs", "verify"],
    {
      cwd: directory,
      encoding: "utf8",
      env: {
        ...process.env,
        RELEASE_SHA: sha,
        RELEASE_TARGET_ENVIRONMENT: "production",
      },
    },
  );

test("backend identity verification rejects matching checkout outside main", () => {
  const result = backend(feature);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /must be on main/);
});

test("backend identity accepts uppercase SHA and an older main commit", () => {
  git(["checkout", older]);
  const result = backend(older.toUpperCase());
  assert.equal(result.status, 0, result.stderr);
});

for (const name of ["mobile-release", "mobile-staging", "backend-deploy"]) {
  const workflow = readFileSync(
    join(repositoryDirectory, `.github/workflows/${name}.yml`),
    "utf8",
  );
  test(`${name} gates source using trusted full main history before candidate execution`, () => {
    assert.match(workflow, /if: \$\{\{ github.ref == 'refs\/heads\/main' \}\}/);
    const trusted = workflow.indexOf("ref: main");
    const gate = workflow.indexOf("git merge-base --is-ancestor");
    const candidate = workflow.indexOf(
      "ref: ${{ steps.provenance.outputs.sha }}",
    );
    const setup = workflow.indexOf("pnpm/action-setup");
    assert.ok(
      trusted >= 0 && trusted < gate && gate < candidate && candidate < setup,
    );
    assert.equal(
      (workflow.match(/uses: actions\/checkout@v4/g) ?? []).length,
      (workflow.match(/persist-credentials: false/g) ?? []).length,
    );
    assert.equal(
      (workflow.match(/uses: actions\/checkout@v4/g) ?? []).length,
      (workflow.match(/fetch-depth: 0/g) ?? []).length,
    );
    if (name === "backend-deploy") {
      assert.equal(workflow.includes("workflow_dispatch:"), false);
      const upload = workflow.slice(
        workflow.indexOf("- name: Upload backend release record"),
      );
      assert.match(upload, /path: \.release-artifacts\/backend-release\.json/);
      assert.match(upload, /include-hidden-files: true/);
      assert.match(workflow, /GITHUB_TOKEN: \$\{\{ github.token \}\}/);
    }
  });
  test(`${name} source gate rejects off-main, malformed and accepts uppercase older main`, () => {
    const match = workflow.match(
      /- name: Verify main source\n[\s\S]*? {8}run: \|\n([\s\S]*?)(?= {6}- )/,
    );
    assert.ok(match, "trusted inline source gate is required");
    const script = match[1]
      .split("\n")
      .map((line) => line.slice(10))
      .join("\n");
    const run = (sha) =>
      spawnSync("bash", ["-e", "-c", script], {
        cwd: directory,
        encoding: "utf8",
        env: {
          ...process.env,
          RELEASE_SHA: sha,
          GITHUB_OUTPUT: join(directory, "gate-output"),
        },
      });
    assert.equal(run(feature).status, 1);
    assert.equal(run("main").status, 1);
    assert.equal(run("$(touch injected)").status, 1);
    const result = run(older.toUpperCase());
    assert.equal(result.status, 0, result.stderr);
    assert.match(
      readFileSync(join(directory, "gate-output"), "utf8"),
      new RegExp(`sha=${older}`),
    );
  });
}

test("actual Convex key-selected target is verified before pushing backend functions", () => {
  const run = (url) =>
    spawnSync(
      process.execPath,
      ["scripts/releases/backend-record.mjs", "verify-url"],
      {
        cwd: directory,
        encoding: "utf8",
        env: {
          ...process.env,
          RELEASE_SHA: older,
          RELEASE_TARGET_ENVIRONMENT: "production",
          RELEASE_BACKEND_URL: url,
        },
      },
    );
  assert.equal(run("https://production-example.convex.cloud").status, 0);
  const wrong = run("https://staging-example.convex.cloud");
  assert.equal(wrong.status, 1);
  assert.match(wrong.stderr, /Convex URL must match/);
});

for (const name of ["mobile-release", "mobile-staging"]) {
  test(`${name} validates pinned client environment before backend and derives EAS CLI pin`, () => {
    const workflow = readFileSync(
      join(repositoryDirectory, `.github/workflows/${name}.yml`),
      "utf8",
    );
    const preflight = workflow.indexOf(" validate-environment'");
    assert.ok(
      preflight > workflow.indexOf("pnpm release:check") &&
        preflight < workflow.indexOf("  backend:"),
    );
    assert.equal(/eas-cli@\d/.test(workflow), false);
    assert.match(
      workflow,
      /require\("\.\/release\.config\.json"\)\.easCliVersion/,
    );
    assert.match(workflow, /eas-cli@\$EAS_CLI_VERSION/);
    const upload = workflow.slice(
      workflow.indexOf("- uses: actions/upload-artifact@v4"),
    );
    assert.match(upload, /path: \.release-artifacts\/mobile-release\.json/);
    assert.match(upload, /include-hidden-files: true/);
    if (name === "mobile-staging") {
      const delivery = workflow.slice(
        workflow.indexOf("- name: Deliver the checked commit"),
      );
      assert.match(delivery, /GITHUB_TOKEN: \$\{\{ github.token \}\}/);
    }
  });
}

test("stale automatic staging cannot deploy an older main revision; manual older revisions remain allowed", () => {
  const run = (sha, event) =>
    spawnSync(
      process.execPath,
      ["scripts/releases/backend-record.mjs", "verify"],
      {
        cwd: directory,
        encoding: "utf8",
        env: {
          ...process.env,
          RELEASE_SHA: sha,
          RELEASE_TARGET_ENVIRONMENT: "staging",
          GITHUB_EVENT_NAME: event,
        },
      },
    );
  git(["checkout", older]);
  assert.equal(run(older, "workflow_dispatch").status, 0);
  const stale = run(older, "push");
  assert.equal(stale.status, 1);
  assert.match(
    stale.stderr,
    /Automatic staging requires the latest main commit/,
  );
  git(["checkout", main]);
  assert.equal(run(main, "push").status, 0);
});

test("backend rechecks live main immediately before pushing, even when checked-out main cache is stale", () => {
  git(["checkout", older]);
  git(["update-ref", "refs/remotes/origin/main", older]);
  git(["update-ref", "refs/heads/main", main]);
  const bin = join(directory, "mock-bin");
  mkdirSync(bin);
  writeFileSync(
    join(bin, "gh"),
    `#!/usr/bin/env node
const {execFileSync} = require('node:child_process');
if (process.env.GH_TOKEN !== 'readonly-test') { process.exit(9); }
console.log(execFileSync('git', ['rev-parse', 'refs/heads/main'], {cwd: ${JSON.stringify(directory)}, encoding: 'utf8'}).trim());
`,
    { mode: 0o755 },
  );
  const run = () =>
    spawnSync(
      process.execPath,
      ["scripts/releases/backend-record.mjs", "verify-url"],
      {
        cwd: directory,
        encoding: "utf8",
        env: {
          ...process.env,
          PATH: `${bin}:${process.env.PATH}`,
          GITHUB_TOKEN: "readonly-test",
          GITHUB_REPOSITORY: "example/app",
          RELEASE_SHA: older,
          RELEASE_TARGET_ENVIRONMENT: "staging",
          GITHUB_EVENT_NAME: "push",
          RELEASE_BACKEND_URL: "https://staging-example.convex.cloud",
        },
      },
    );
  const stale = run();
  assert.equal(stale.status, 1);
  assert.match(
    stale.stderr,
    /Automatic staging requires the latest main commit/,
  );
  git(["update-ref", "refs/heads/main", older]);
  assert.equal(run().status, 0);
  git(["update-ref", "refs/remotes/origin/main", main]);
});
