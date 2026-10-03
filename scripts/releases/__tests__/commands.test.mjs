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
config.stagingConvexUrl = "https://test.convex.cloud";
config.productionConvexUrl = "https://production.convex.cloud";
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
  const result = run("start-mobile-release", [
    "--environment",
    "staging",
    "--notes",
    notes,
    "--dry-run",
  ]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).inputs.notes, notes);
  assert.equal(
    run("start-mobile-release", [
      "--environment",
      "staging",
      "--version",
      "0.0.0",
      "--dry-run",
    ]).status,
    1,
  );
  assert.equal(
    run("start-mobile-release", [
      "--environment",
      "staging",
      "--action",
      "update-promote",
      "--dry-run",
    ]).status,
    1,
  );
});

test("resolution fails before deploying backend when token or checkout is wrong", () => {
  const env = {
    RELEASE_SHA: mainSha,
    GITHUB_SHA: mainSha,
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
  git(["update-ref", "refs/remotes/origin/main", sha]);
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
  writeFileSync(
    join(bin, "gh"),
    `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
fs.appendFileSync(process.env.FAKE_EAS_LOG, JSON.stringify(['gh', ...args]) + '\\n');
if (!process.env.GH_TOKEN) { process.exit(7); }
const counterFile = process.env.FAKE_GH_COUNTER;
const index = fs.existsSync(counterFile) ? Number(fs.readFileSync(counterFile, 'utf8')) : 0;
fs.writeFileSync(counterFile, String(index + 1));
const shas = JSON.parse(process.env.FAKE_GH_MAIN_SHAS);
console.log(shas[Math.min(index, shas.length - 1)]);
`,
    { mode: 0o755 },
  );
  const env = {
    PATH: `${bin}:${process.env.PATH}`,
    FAKE_GH_COUNTER: join(bin, "gh-count"),
    FAKE_GH_MAIN_SHAS: JSON.stringify([sha]),
    GITHUB_REPOSITORY: "example/app",
    GITHUB_TOKEN: "fake-read-only-token",
    FAKE_EAS_LOG: log,
    EXPO_TOKEN: "fake",
    RELEASE_SHA: sha,
    GITHUB_SHA: sha,
    RELEASE_VERSION: "9.9.9",
    RELEASE_TARGET_ENVIRONMENT: environment,
    APP_VARIANT: staging ? "preview" : "production",
    EXPO_PUBLIC_CONVEX_URL: staging
      ? config.stagingConvexUrl
      : config.productionConvexUrl,
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
    GITHUB_SHA: sha,
    RELEASE_TARGET_ENVIRONMENT: "production",
    GITHUB_OUTPUT: join(directory, "outputs"),
  });
  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /Set submit.production.ios.ascAppId before deploying/,
  );
});

test("setup failures replace stale success artifacts and retain failure stage", (context) => {
  const mock = mockDelivery(context, "staging");
  const result = run("mobile-release", ["deliver"], {
    ...mock.env,
    APP_VARIANT: "production",
  });
  assert.equal(result.status, 1);
  const record = JSON.parse(
    readFileSync(join(repo, ".release-artifacts/mobile-release.json"), "utf8"),
  );
  assert.equal(record.stage, "failed");
  assert.equal(record.failedAt, "validating");
  assert.equal(record.build, undefined);
  assert.match(record.error, /APP_VARIANT/);
});

test("untracked source files cannot enter an otherwise clean EAS delivery", (context) => {
  const mock = mockDelivery(context, "production");
  const injected = join(repo, "apps/mobile/injected.js");
  writeFileSync(injected, "console.log('uncommitted source');");
  try {
    const result = run("mobile-release", ["deliver"], mock.env);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /unchanged checkout/);
  } finally {
    rmSync(injected);
  }
});

test("environment preflight rejects cross-environment Convex before delivery", (context) => {
  const mock = mockDelivery(context, "staging");
  const result = run("mobile-release", ["validate-environment"], {
    ...mock.env,
    EXPO_PUBLIC_CONVEX_URL: config.productionConvexUrl,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /selected environment/);
  assert.equal(
    mock
      .commands()
      .some((args) => ["build", "update", "submit"].includes(args[2])),
    false,
  );
});

test("automatic staging refuses an older main commit while manual releases remain possible", (context) => {
  const mock = mockDelivery(context, "staging");
  writeFileSync(versionFile, JSON.stringify({ expo: { version: "10.0.0" } }));
  const latestSha = commit("feat: main advances before automatic delivery");
  git(["update-ref", "refs/remotes/origin/main", latestSha]);
  git(["checkout", "--detach", sha]);
  try {
    const env = {
      ...mock.env,
      GITHUB_EVENT_NAME: "push",
      GITHUB_OUTPUT: join(directory, "outputs"),
    };
    for (const action of ["resolve", "deliver"]) {
      const result = run("mobile-release", [action], env);
      assert.equal(result.status, 1);
      assert.match(
        result.stderr,
        /Automatic staging requires the latest main commit/,
      );
    }
    const manual = run("mobile-release", ["resolve"], {
      ...env,
      GITHUB_EVENT_NAME: "workflow_dispatch",
    });
    assert.equal(manual.status, 0, manual.stderr);
  } finally {
    git(["update-ref", "refs/remotes/origin/main", sha]);
  }
});

test("release commands require an explicit target instead of defaulting to production", () => {
  for (const args of [[], ["--dry-run"]]) {
    const result = run("start-mobile-release", args);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Choose staging or production/);
    assert.equal(result.stdout, "");
  }
});

test("automatic staging checks live main before build and again before exact submission", (context) => {
  const mock = mockDelivery(context, "staging", { "build:list": [] });
  const result = run("mobile-release", ["deliver"], {
    ...mock.env,
    GITHUB_EVENT_NAME: "push",
    FAKE_GH_MAIN_SHAS: JSON.stringify([sha, mainSha]),
  });
  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /Automatic staging requires the latest main commit/,
  );
  const calls = mock.commands();
  const buildIndex = calls.findIndex((args) => args[2] === "build");
  const freshIndices = calls.flatMap((args, index) =>
    args[0] === "gh" ? [index] : [],
  );
  assert.equal(freshIndices.length, 2);
  assert.ok(freshIndices[0] < buildIndex && freshIndices[1] > buildIndex);
  assert.equal(
    calls.some((args) => args[2] === "submit"),
    false,
  );
  const record = JSON.parse(
    readFileSync(join(repo, ".release-artifacts/mobile-release.json"), "utf8"),
  );
  assert.equal(record.stage, "failed");
  assert.equal(record.failedAt, "built");
  assert.equal(record.build.id, mock.build.id);
});

test("live-main freshness prevents stale staging uploads despite a matching cached main", (context) => {
  const mock = mockDelivery(context, "staging", { "build:list": [] });
  const result = run("mobile-release", ["deliver"], {
    ...mock.env,
    GITHUB_EVENT_NAME: "push",
    FAKE_GH_MAIN_SHAS: JSON.stringify([mainSha]),
  });
  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /Automatic staging requires the latest main commit/,
  );
  assert.equal(
    mock
      .commands()
      .some((args) => ["build", "update", "submit"].includes(args[2])),
    false,
  );
});

test("live-main freshness prevents stale staging OTA publication", (context) => {
  const channel = config.stagingChannel;
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
  const result = run("mobile-release", ["deliver"], {
    ...mock.env,
    GITHUB_EVENT_NAME: "push",
    FAKE_GH_MAIN_SHAS: JSON.stringify([mainSha]),
  });
  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /Automatic staging requires the latest main commit/,
  );
  assert.equal(
    mock.commands().some((args) => args[2] === "update"),
    false,
  );
});

test("manual older staging and explicit production bypass automatic freshness checks", (context) => {
  for (const environment of ["staging", "production"]) {
    const mock = mockDelivery(context, environment, { "build:list": [] });
    const result = run("mobile-release", ["deliver"], {
      ...mock.env,
      GITHUB_EVENT_NAME: "workflow_dispatch",
      GITHUB_TOKEN: "",
      FAKE_GH_MAIN_SHAS: JSON.stringify([mainSha]),
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(
      mock.commands().some((args) => args[0] === "gh"),
      false,
    );
  }
});

test("committed JavaScript config primitive failures retain a useful CLI diagnostic", () => {
  const configPath = join(repo, "release.config.json");
  const dynamicPath = join(repo, "apps/mobile/app.config.js");
  writeFileSync(
    configPath,
    JSON.stringify({ ...config, versionFile: "apps/mobile/app.config.js" }),
  );
  writeFileSync(
    dynamicPath,
    'throw "missing config input"; export default {};',
  );
  git(["add", "apps/mobile/app.config.js"]);
  const failingSha = commit("test: primitive JavaScript config failure");
  git(["update-ref", "refs/remotes/origin/main", failingSha]);
  try {
    for (const [script, args] of [
      ["start-mobile-release", ["--environment", "staging", "--dry-run"]],
      ["mobile-release", ["resolve"]],
    ]) {
      const result = run(script, args, {
        EXPO_TOKEN: "fake",
        RELEASE_SHA: failingSha,
        GITHUB_SHA: failingSha,
        RELEASE_TARGET_ENVIRONMENT: "staging",
      });
      assert.equal(result.status, 1);
      assert.equal(result.stderr.trim(), "missing config input");
    }
  } finally {
    git(["checkout", "--detach", sha]);
    git(["update-ref", "refs/remotes/origin/main", sha]);
  }
});

test("Expo config and EAS setup subprocess failures are captured as delivery failures", (context) => {
  for (const overrides of [{ config: null }, { "build:list": null }]) {
    const mock = mockDelivery(context, "staging", overrides);
    const result = run("mobile-release", ["deliver"], mock.env);
    assert.equal(result.status, 1);
    const record = JSON.parse(
      readFileSync(
        join(repo, ".release-artifacts/mobile-release.json"),
        "utf8",
      ),
    );
    assert.equal(record.stage, "failed");
    assert.equal(record.failedAt, "validating");
    assert.equal(record.build, undefined);
    assert.match(record.error, /Command failed/);
    assert.equal(
      mock
        .commands()
        .some((args) => ["update", "build", "submit"].includes(args[2])),
      false,
    );
  }
});
