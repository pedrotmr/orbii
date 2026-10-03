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
import { repositoryDirectory as sourceRepository } from "../config.mjs";

const directory = mkdtempSync(join(tmpdir(), "release-commands-"));
after(() => rmSync(directory, { recursive: true, force: true }));
const repo = join(directory, "repo");
mkdirSync(join(repo, "apps/mobile"), { recursive: true });
cpSync(
  join(sourceRepository, "scripts/releases"),
  join(repo, "scripts/releases"),
  { recursive: true },
);
const config = JSON.parse(
  readFileSync(join(sourceRepository, "release.config.json"), "utf8"),
);
config.versionFile = "apps/mobile/app.json";
writeFileSync(join(repo, "release.config.json"), JSON.stringify(config));
writeFileSync(join(repo, ".gitignore"), ".release-artifacts/\n");
writeFileSync(
  join(repo, "apps/mobile/eas.json"),
  JSON.stringify({
    submit: { [config.stagingProfile]: { ios: { ascAppId: "123" } } },
  }),
);
const versionFile = join(repo, config.versionFile);
const git = (args) =>
  execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
const commit = (subject) => {
  git([
    "add",
    "apps/mobile/app.json",
    "apps/mobile/eas.json",
    "release.config.json",
    "scripts/releases",
    ".gitignore",
  ]);
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
git(["init", "--initial-branch=main"]);
writeFileSync(versionFile, JSON.stringify({ expo: { version: "1.2.3" } }));
const mainSha = commit("feat: pushed version");
git(["update-ref", "refs/remotes/origin/main", mainSha]);
writeFileSync(versionFile, JSON.stringify({ expo: { version: "9.9.9" } }));
const sha = commit("feat: local-only version");
const run = (script, args, env = {}) =>
  spawnSync(process.execPath, [`scripts/releases/${script}.mjs`, ...args], {
    cwd: repo,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });

test("local commands release pushed main even with a local-only version", () => {
  for (const environment of ["staging", "production"]) {
    const result = run("start-mobile-release", [
      "--environment",
      environment,
      "--dry-run",
    ]);
    assert.equal(result.status, 0, result.stderr);
    const record = JSON.parse(result.stdout);
    assert.equal(record.source.sha, mainSha);
    assert.equal(record.source.version, "1.2.3");
  }
});

test("custom notes remain data and optional version cannot override the commit", () => {
  const notes = "$(touch should-not-exist); `echo nope`\nSecond line";
  const result = run("start-mobile-release", ["--notes", notes, "--dry-run"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).inputs.notes, notes);
  assert.equal(
    run("start-mobile-release", ["--version", "0.0.0", "--dry-run"]).status,
    1,
  );
  assert.equal(
    run("start-mobile-release", ["--action", "update-promote", "--dry-run"])
      .status,
    1,
  );
});

test("resolution fails before deploying backend when token or checkout is wrong", () => {
  const env = {
    RELEASE_SHA: mainSha,
    EXPO_TOKEN: "",
    GITHUB_OUTPUT: join(directory, "outputs"),
  };
  assert.match(
    run("mobile-release", ["resolve"], env).stderr,
    /EXPO_TOKEN secret is required/,
  );
  assert.match(
    run("mobile-release", ["resolve"], { ...env, EXPO_TOKEN: "fake" }).stderr,
    /Checkout must match/,
  );
});

const mockDelivery = (context, environment, overrides = {}) => {
  const bin = mkdtempSync(join(directory, "bin-"));
  context.after(() => rmSync(bin, { recursive: true, force: true }));
  const log = join(bin, "calls.jsonl");
  const staging = environment === "staging";
  const build = {
    id: "11111111-1111-1111-1111-111111111111",
    app: { id: config.easProjectId },
    platform: "IOS",
    status: "FINISHED",
    distribution: "STORE",
    gitCommitHash: sha,
    buildProfile: staging ? config.stagingProfile : config.productionProfile,
    appIdentifier: staging
      ? config.stagingBundleIdentifier
      : config.bundleIdentifier,
    updateChannel: {
      name: staging ? config.stagingChannel : config.productionChannel,
    },
    appVersion: "9.9.9",
    runtime: { version: "9.9.9" },
    appBuildVersion: "42",
  };
  const app = {
    ios: { bundleIdentifier: build.appIdentifier },
    extra: { eas: { projectId: config.easProjectId } },
    version: "9.9.9",
    runtimeVersion: "9.9.9",
  };
  const responses = {
    config: app,
    "build:list": [build],
    build: [{ id: build.id }],
    "build:view": build,
    "fingerprint:compare": {
      fingerprint1: { hash: "old" },
      fingerprint2: { hash: "new" },
    },
    ...overrides,
  };
  writeFileSync(
    join(bin, "pnpm"),
    `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
fs.appendFileSync(process.env.FAKE_EAS_LOG, JSON.stringify(args) + '\\n');
if (args[2] === 'submit') { process.exit(Number(process.env.FAKE_SUBMIT_EXIT || 0)); }
const result = ${JSON.stringify(responses)}[args[2]];
if (!result) { process.exit(9); }
console.log(JSON.stringify(result));
`,
    { mode: 0o755 },
  );
  const env = {
    PATH: `${bin}:${process.env.PATH}`,
    FAKE_EAS_LOG: log,
    EXPO_TOKEN: "fake",
    RELEASE_SHA: sha,
    RELEASE_VERSION: "9.9.9",
    RELEASE_TARGET_ENVIRONMENT: environment,
    APP_VARIANT: staging ? "preview" : "production",
    EXPO_PUBLIC_CONVEX_URL: "https://test.convex.cloud",
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: staging
      ? "pk_test_fake"
      : "pk_live_fake",
  };
  const commands = () =>
    readFileSync(log, "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
  return { env, commands, build };
};

test("native mismatch stops staging before either update or build", (context) => {
  const mock = mockDelivery(context, "staging");
  const result = run("mobile-release", ["deliver"], mock.env);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Bump the app version/);
  assert.equal(
    mock
      .commands()
      .some((args) => ["update", "build", "submit"].includes(args[2])),
    false,
  );
});

test("production submits the exact finished build and saves its number", (context) => {
  const mock = mockDelivery(context, "production");
  const result = run("mobile-release", ["deliver"], mock.env);
  assert.equal(result.status, 0, result.stderr);
  const submit = mock.commands().find((args) => args[2] === "submit");
  assert.equal(submit[submit.indexOf("--id") + 1], mock.build.id);
  assert.equal(submit.includes("--latest"), false);
  assert.equal(submit.includes("--json"), false);
  assert.equal(submit.includes("--wait"), true);
  const record = JSON.parse(
    readFileSync(join(repo, ".release-artifacts/mobile-release.json"), "utf8"),
  );
  assert.equal(record.build.buildNumber, "42");
  assert.equal(record.stage, "uploaded-to-app-store-connect");
});

test("wrong build provenance blocks submit; failed submit retains the built ID", (context) => {
  const wrong = mockDelivery(context, "production");
  const mock = mockDelivery(context, "production", {
    "build:view": { ...wrong.build, gitCommitHash: mainSha },
  });
  assert.equal(run("mobile-release", ["deliver"], mock.env).status, 1);
  assert.equal(
    mock.commands().some((args) => args[2] === "submit"),
    false,
  );
  const result = run("mobile-release", ["deliver"], {
    ...wrong.env,
    FAKE_SUBMIT_EXIT: "1",
  });
  assert.equal(result.status, 1);
  const record = JSON.parse(
    readFileSync(join(repo, ".release-artifacts/mobile-release.json"), "utf8"),
  );
  assert.equal(record.failedAt, "built");
  assert.equal(record.build.id, wrong.build.id);
});

test("compatible staging publishes only to preview and records the update IDs", (context) => {
  const channel = "preview";
  const mock = mockDelivery(context, "staging", {
    "fingerprint:compare": {
      fingerprint1: { hash: "same" },
      fingerprint2: { hash: "same" },
    },
    "channel:view": {
      currentPage: {
        name: channel,
        updateBranches: [{ id: "branch", name: channel }],
        branchMapping: JSON.stringify({
          data: [{ branchId: "branch", branchMappingLogic: "true" }],
        }),
      },
    },
    update: [{ id: "update-id", group: "group-id" }],
  });
  const notes = "$(echo notes-remain-data)";
  const result = run("mobile-release", ["deliver"], {
    ...mock.env,
    RELEASE_NOTES: notes,
  });
  assert.equal(result.status, 0, result.stderr);
  const update = mock.commands().find((args) => args[2] === "update");
  assert.equal(update[update.indexOf("--channel") + 1], channel);
  assert.equal(update[update.indexOf("--environment") + 1], "preview");
  assert.equal(update[update.indexOf("--message") + 1], notes);
  assert.equal(
    mock.commands().some((args) => args[2] === "build"),
    false,
  );
  const record = JSON.parse(
    readFileSync(join(repo, ".release-artifacts/mobile-release.json"), "utf8"),
  );
  assert.equal(record.stage, "update-published");
  assert.deepEqual(record.updates, [{ id: "update-id", group: "group-id" }]);
});

test("first staging delivery builds and submits the Dev app", (context) => {
  const mock = mockDelivery(context, "staging", { "build:list": [] });
  const result = run("mobile-release", ["deliver"], mock.env);
  assert.equal(result.status, 0, result.stderr);
  const build = mock.commands().find((args) => args[2] === "build");
  assert.equal(build[build.indexOf("--profile") + 1], config.stagingProfile);
  assert.equal(
    mock.commands().some((args) => args[2] === "update"),
    false,
  );
});

test("resolution blocks an unconfigured production app before delivery", () => {
  const result = run("mobile-release", ["resolve"], {
    EXPO_TOKEN: "fake",
    RELEASE_SHA: sha,
    RELEASE_TARGET_ENVIRONMENT: "production",
    GITHUB_OUTPUT: join(directory, "outputs"),
  });
  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /Set submit.production.ios.ascAppId before deploying/,
  );
});
