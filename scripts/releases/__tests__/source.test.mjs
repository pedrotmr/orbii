import assert from "node:assert/strict";
import { test } from "node:test";
import { readCommittedVersion, resolveSource } from "../source.mjs";

const sha = "a".repeat(40);
const fixture = () => {
  const commands = [];
  return {
    commands,
    git: (args) => {
      commands.push(args);
      return args[0] === "rev-parse" ? sha : "";
    },
    readVersion: async (selectedSha) => {
      assert.equal(selectedSha, sha);
      return "1.2.3";
    },
  };
};

test("a normal release fetches main once and pins its SHA and committed version", async () => {
  const dependencies = fixture();
  const source = await resolveSource({ action: "testflight" }, dependencies);
  assert.deepEqual(source, { sha, version: "1.2.3" });
  assert.deepEqual(dependencies.commands, [
    [
      "fetch",
      "--no-tags",
      "origin",
      "+refs/heads/main:refs/remotes/origin/main",
    ],
    ["rev-parse", "--verify", "refs/remotes/origin/main^{commit}"],
    ["merge-base", "--is-ancestor", sha, "refs/remotes/origin/main"],
  ]);
});

test("offline dry runs use cached main without fetching or accessing EAS", async () => {
  const dependencies = fixture();
  dependencies.eas = () => {
    throw new Error("Unexpected EAS call");
  };
  await resolveSource({ action: "testflight", dryRun: true }, dependencies);
  assert.deepEqual(dependencies.commands, [
    ["rev-parse", "--verify", "refs/remotes/origin/main^{commit}"],
    ["merge-base", "--is-ancestor", sha, "refs/remotes/origin/main"],
  ]);
});

test("workflow resolution stays on the selected event SHA even if main advances", async () => {
  const dependencies = fixture();
  await resolveSource({ action: "testflight", workflowSha: sha }, dependencies);
  assert.deepEqual(dependencies.commands, [
    ["rev-parse", "--verify", `${sha}^{commit}`],
    ["merge-base", "--is-ancestor", sha, "refs/remotes/origin/main"],
  ]);
});

test("an optional version assertion cannot override the selected commit's version", async () => {
  await assert.rejects(
    resolveSource(
      { action: "testflight", ref: sha, version: "9.9.9" },
      fixture(),
    ),
    /does not match/,
  );
});

test("version discovery evaluates the selected committed config", async () => {
  const version = await readCommittedVersion(
    sha,
    (args) => {
      assert.deepEqual(args, ["show", `${sha}:apps/mobile/app.config.js`]);
      return 'const appVersion = "2.3.4"; export default {expo: {version: appVersion}};';
    },
    "apps/mobile/app.config.js",
  );
  assert.equal(version, "2.3.4");
});

test("JSON version files support function-based Expo configs", async () => {
  const version = await readCommittedVersion(
    sha,
    (args) => {
      assert.deepEqual(args, ["show", `${sha}:apps/mobile/app.json`]);
      return JSON.stringify({ expo: { version: "3.4.5" } });
    },
    "apps/mobile/app.json",
  );
  assert.equal(version, "3.4.5");
});

test("off-main refs fail before evaluating a committed version file", async () => {
  const dependencies = fixture();
  let versionRead = false;
  dependencies.git = (args) => {
    dependencies.commands.push(args);
    if (args[0] === "merge-base") {
      throw new Error("not an ancestor");
    }
    return args[0] === "rev-parse" ? sha : "";
  };
  dependencies.readVersion = async () => {
    versionRead = true;
    return "1.2.3";
  };
  await assert.rejects(
    resolveSource({ ref: sha, dryRun: true }, dependencies),
    /must be on main/,
  );
  assert.equal(versionRead, false);
});

test("dynamic function version files explicitly require a static version source", async () => {
  await assert.rejects(
    readCommittedVersion(
      sha,
      () => "export default ({config}) => ({...config, version: '1.2.3'});",
      "apps/mobile/app.config.js",
    ),
    /JSON or a self-contained.*object/,
  );
});
