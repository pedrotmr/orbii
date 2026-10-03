import assert from "node:assert/strict";
import { test } from "node:test";
import {
  errorMessage,
  validateBackendUrl,
  validateContext,
  validateChannel,
  validateRelease,
  validateSubmission,
} from "../guards.mjs";

const config = {
  easProjectId: "project",
  stagingBundleIdentifier: "app.dev",
  bundleIdentifier: "app.prod",
  stagingConvexUrl: "https://test.convex.cloud",
  productionConvexUrl: "https://production.convex.cloud",
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
    { ...channel, updateBranches: [{ id: "branch", name: "production" }] },
    {
      ...channel,
      branchMapping: JSON.stringify({
        data: [{ branchId: "other-branch", branchMappingLogic: "true" }],
      }),
    },
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

test("Convex targets are pinned separately and missing production setup fails closed", () => {
  const productionApp = { ...app, ios: { bundleIdentifier: "app.prod" } };
  assert.throws(
    () =>
      validateContext(app, config, "staging", "1.2.3", {
        ...env,
        EXPO_PUBLIC_CONVEX_URL: config.productionConvexUrl,
      }),
    /selected environment/,
  );
  assert.throws(
    () =>
      validateContext(productionApp, config, "production", "1.2.3", {
        ...env,
        EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_live_example",
      }),
    /selected environment/,
  );
  assert.throws(
    () =>
      validateContext(
        productionApp,
        { ...config, productionConvexUrl: "" },
        "production",
        "1.2.3",
        {
          ...env,
          EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_live_example",
        },
      ),
    /production Convex URL/,
  );
  assert.throws(
    () =>
      validateContext(
        app,
        { ...config, productionConvexUrl: config.stagingConvexUrl },
        "staging",
        "1.2.3",
        env,
      ),
    /different deployments/,
  );
  validateContext(productionApp, config, "production", "1.2.3", {
    ...env,
    EXPO_PUBLIC_CONVEX_URL: config.productionConvexUrl,
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_live_example",
  });
});

test("malformed submission config retains the actionable setup error", () => {
  for (const eas of [null, undefined, {}, []]) {
    assert.throws(
      () => validateSubmission(eas, { stagingProfile: "dev" }, "staging"),
      /Set submit.dev.ios.ascAppId before deploying the backend/,
    );
  }
});

test("malformed channel responses fail with the channel validation error", () => {
  for (const result of [null, undefined, {}, { currentPage: null }]) {
    assert.throws(
      () => validateChannel(result, "preview"),
      /Channel preview must be active/,
    );
  }
});

test("failure diagnostics retain messages for Error and primitive throws", () => {
  assert.equal(errorMessage(new Error("upload failed")), "upload failed");
  assert.equal(errorMessage("literal failure"), "literal failure");
  assert.equal(errorMessage(null), "null");
  assert.equal(errorMessage(undefined), "undefined");
});

test("backend target pins support standard Convex and custom HTTPS origins", () => {
  for (const url of [
    "https://production.convex.cloud",
    "https://api.example.com",
    "https://api.example.com:8443",
  ]) {
    validateBackendUrl(
      url,
      { ...config, productionConvexUrl: url },
      "production",
    );
  }
});

test("backend origins reject insecure, malformed, credentialed, or non-origin targets", () => {
  for (const url of [
    "http://api.example.com",
    "https://api.example.com/",
    "https://api.example.com/path",
    "https://api.example.com?debug=true",
    "https://api.example.com#fragment",
    "https://user:password@api.example.com",
    "https://@api.example.com",
    "https://api.example.com:65536",
    "https://api.example.com:0",
    "https://api.example.com:",
    "https://api.example.com?",
    "https://api.example.com#",
    "https://api.example.com:invalid",
    " https://api.example.com",
    "not-a-url",
  ]) {
    assert.throws(
      () =>
        validateBackendUrl(
          url,
          { ...config, productionConvexUrl: url },
          "production",
        ),
      /Convex URL must match/,
    );
  }
  assert.throws(
    () => validateBackendUrl(config.productionConvexUrl, config, "other"),
    /Choose staging or production/,
  );
});

test("custom origins remain exact and aliases cannot share staging and production", () => {
  const custom = {
    ...config,
    stagingConvexUrl: "https://staging.example.com",
    productionConvexUrl: "https://api.example.com",
  };
  assert.throws(
    () => validateBackendUrl(custom.productionConvexUrl, custom, "staging"),
    /Convex URL must match/,
  );
  assert.throws(
    () =>
      validateBackendUrl(
        custom.stagingConvexUrl,
        { ...custom, productionConvexUrl: "https://STAGING.example.com:443" },
        "staging",
      ),
    /different deployments/,
  );
});
