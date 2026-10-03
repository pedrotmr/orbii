import assert from "node:assert/strict";
import { test } from "node:test";
import {
  validateContext,
  validateChannel,
  validateRelease,
  validateSubmission,
} from "../guards.mjs";

const config = {
  easProjectId: "project",
  stagingBundleIdentifier: "app.dev",
  bundleIdentifier: "app.prod",
};
const app = {
  ios: { bundleIdentifier: "app.dev" },
  extra: { eas: { projectId: "project" } },
  version: "1.2.3",
  runtimeVersion: "1.2.3",
};
const env = {
  EXPO_PUBLIC_CONVEX_URL: "https://test.convex.cloud",
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_example",
};

test("wrong app, runtime, project, or Clerk instance is blocked", () => {
  validateContext(app, config, "staging", "1.2.3", env);
  for (const changed of [
    { ...app, runtimeVersion: "1.2.2" },
    { ...app, ios: { bundleIdentifier: "app.prod" } },
    { ...app, extra: { eas: { projectId: "wrong" } } },
  ]) {
    assert.throws(
      () => validateContext(changed, config, "staging", "1.2.3", env),
      /Expo config/,
    );
  }
  assert.throws(
    () =>
      validateContext(app, config, "staging", "1.2.3", {
        ...env,
        EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_live_wrong",
      }),
    /matching test/,
  );
});

test("updates reject paused channels, wrong branches, and branch rollouts", () => {
  const channel = {
    name: "preview",
    updateBranches: [{ id: "branch", name: "preview" }],
    branchMapping: JSON.stringify({
      data: [{ branchId: "branch", branchMappingLogic: "true" }],
    }),
  };
  validateChannel({ currentPage: channel }, "preview");
  for (const changed of [
    { ...channel, isPaused: true },
    { ...channel, name: "production" },
    {
      ...channel,
      branchMapping: JSON.stringify({
        data: [{ branchId: "branch", branchMappingLogic: { percent: 50 } }],
      }),
    },
  ]) {
    assert.throws(
      () => validateChannel({ currentPage: changed }, "preview"),
      /active and point only/,
    );
  }
});

test("source requires a full SHA and committed public version", () => {
  assert.throws(
    () => validateRelease({ sha: "main", version: "1.2.3" }),
    /40-character/,
  );
  assert.throws(
    () => validateRelease({ sha: "a".repeat(40), version: "latest" }),
    /1.2.0/,
  );
});

test("submission app IDs must exist before backend deployment", () => {
  const profiles = { stagingProfile: "dev", productionProfile: "prod" };
  const eas = { submit: { dev: { ios: { ascAppId: "123" } } } };
  validateSubmission(eas, profiles, "staging");
  assert.throws(
    () => validateSubmission(eas, profiles, "production"),
    /before deploying/,
  );
  assert.throws(() => validateSubmission(eas, profiles, "other"), /Choose/);
});
