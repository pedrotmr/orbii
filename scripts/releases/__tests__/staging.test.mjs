import assert from "node:assert/strict";
import { test } from "node:test";
import { releaseConfig } from "../config.mjs";
import { selectStagingDelivery } from "../guards.mjs";

const build = {
  id: "11111111-1111-1111-1111-111111111111",
  app: { id: releaseConfig.easProjectId },
  platform: "IOS",
  status: "FINISHED",
  distribution: "STORE",
  buildProfile: releaseConfig.stagingProfile,
  appIdentifier: releaseConfig.stagingBundleIdentifier,
  updateChannel: { name: releaseConfig.stagingChannel },
  appVersion: "1.2.3",
  runtime: { version: "1.2.3" },
};
const sameNative = {
  fingerprint1: { hash: "same" },
  fingerprint2: { hash: "same" },
};

test("staging uses OTA only for a matching Dev build, runtime, and native fingerprint", () => {
  assert.equal(
    selectStagingDelivery(build, releaseConfig, "1.2.3", sameNative),
    "update",
  );
  assert.throws(
    () =>
      selectStagingDelivery(
        { ...build, appIdentifier: releaseConfig.bundleIdentifier },
        releaseConfig,
        "1.2.3",
        sameNative,
      ),
    /finished iOS store/,
  );
});

test("first staging delivery and a new runtime produce TestFlight builds", () => {
  assert.equal(
    selectStagingDelivery(undefined, releaseConfig, "1.2.3"),
    "testflight",
  );
  assert.equal(
    selectStagingDelivery(build, releaseConfig, "1.2.4"),
    "testflight",
  );
});

test("changed or unknown native fingerprints cannot reuse an installed runtime", () => {
  assert.throws(
    () =>
      selectStagingDelivery(build, releaseConfig, "1.2.3", {
        fingerprint1: { hash: "old" },
        fingerprint2: { hash: "new" },
      }),
    /Bump the app version/,
  );
  assert.throws(
    () => selectStagingDelivery(build, releaseConfig, "1.2.3"),
    /Bump the app version/,
  );
  assert.throws(
    () =>
      selectStagingDelivery(
        build,
        releaseConfig,
        "1.2.3",
        undefined,
        "testflight",
      ),
    /Bump the app version/,
  );
});

test("a requested staging TestFlight rebuild still verifies native compatibility", () => {
  assert.equal(
    selectStagingDelivery(
      build,
      releaseConfig,
      "1.2.3",
      sameNative,
      "testflight",
    ),
    "testflight",
  );
});
