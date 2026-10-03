export const errorMessage = (error) =>
  error instanceof Error ? error.message : String(error);

export const requireValue = (value, name) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} is required.`);
  }
  return value;
};

export const validateRelease = ({ sha, version }) => {
  if (!/^[a-f\d]{40}$/i.test(sha ?? "")) {
    throw new Error("Select a full 40-character commit SHA.");
  }

  if (!/^\d+\.\d+\.\d+$/.test(version ?? "")) {
    throw new Error("The app version must have the form 1.2.0.");
  }
};

export const validateBuild = (build, config, environment) => {
  const staging = environment === "staging";
  if (
    !build?.id ||
    build.app?.id !== config.easProjectId ||
    build.platform !== "IOS" ||
    build.status !== "FINISHED" ||
    build.distribution !== "STORE" ||
    build.isForIosSimulator === true ||
    build.buildProfile !==
      (staging ? config.stagingProfile : config.productionProfile) ||
    build.appIdentifier !==
      (staging ? config.stagingBundleIdentifier : config.bundleIdentifier) ||
    build.updateChannel?.name !==
      (staging ? config.stagingChannel : config.productionChannel)
  ) {
    throw new Error(
      "Expected a finished iOS store build for the selected app, profile, and channel.",
    );
  }
};

export const selectStagingDelivery = (
  build,
  config,
  version,
  comparison,
  requested = "auto",
) => {
  if (!["auto", "testflight"].includes(requested)) {
    throw new Error("Staging delivery must be auto or testflight.");
  }

  if (!build) {
    return "testflight";
  }
  validateBuild(build, config, "staging");
  if (build.appVersion !== version || build.runtime?.version !== version) {
    return "testflight";
  }
  const first = comparison?.fingerprint1?.hash;
  const second = comparison?.fingerprint2?.hash;
  if (!first || !second || first !== second) {
    throw new Error(
      "Native compatibility is unproven. Bump the app version/runtime before delivery.",
    );
  }
  return requested === "testflight" ? "testflight" : "update";
};

export const validateChannel = (result, name) => {
  const channel = result?.currentPage;
  const branches = channel?.updateBranches;
  const mapping = JSON.parse(channel?.branchMapping ?? "null");
  if (
    channel?.name !== name ||
    channel?.isPaused ||
    !Array.isArray(branches) ||
    branches.length !== 1 ||
    branches[0].name !== name ||
    mapping?.data?.length !== 1 ||
    mapping.data[0].branchId !== branches[0].id ||
    mapping.data[0].branchMappingLogic !== "true"
  ) {
    throw new Error(
      `Channel ${name} must be active and point only to its same-named branch.`,
    );
  }
};

export const validateContext = (app, config, environment, version, env) => {
  const staging = environment === "staging";
  if (
    app.ios?.bundleIdentifier !==
      (staging ? config.stagingBundleIdentifier : config.bundleIdentifier) ||
    app.extra?.eas?.projectId !== config.easProjectId ||
    app.version !== version ||
    app.runtimeVersion !== version
  ) {
    throw new Error(
      "Expo config must match the selected app identity, version, and runtime.",
    );
  }
  validateBackendUrl(env.EXPO_PUBLIC_CONVEX_URL, config, environment);
  const key = requireValue(
    env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
    "Clerk publishable key",
  );
  if (!key.startsWith(staging ? "pk_test_" : "pk_live_")) {
    throw new Error("Services must use the matching test/live Clerk instance.");
  }
};

export const validateSubmission = (eas, config, environment) => {
  if (!["staging", "production"].includes(environment)) {
    throw new Error("Choose staging or production.");
  }
  const profile =
    environment === "staging"
      ? config.stagingProfile
      : config.productionProfile;
  const appId = eas?.submit?.[profile]?.ios?.ascAppId;
  if (!/^\d+$/.test(appId ?? "")) {
    throw new Error(
      `Set submit.${profile}.ios.ascAppId before deploying the backend.`,
    );
  }
};

const parseBackendOrigin = (value) => {
  if (
    typeof value !== "string" ||
    value.endsWith(":") ||
    !/^https:\/\/[^/?#\\\s@]+$/.test(value)
  ) {
    return null;
  }
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      url.hostname &&
      !url.username &&
      !url.password &&
      url.port !== "0"
      ? url.origin
      : null;
  } catch {
    return null;
  }
};

export const validateBackendUrl = (url, config, environment) => {
  if (!["staging", "production"].includes(environment)) {
    throw new Error("Choose staging or production.");
  }
  const expected = requireValue(
    environment === "staging"
      ? config.stagingConvexUrl
      : config.productionConvexUrl,
    `${environment} Convex URL in release.config.json`,
  );
  const expectedOrigin = parseBackendOrigin(expected);
  const otherOrigin = parseBackendOrigin(
    environment === "staging"
      ? config.productionConvexUrl
      : config.stagingConvexUrl,
  );
  if (expectedOrigin && expectedOrigin === otherOrigin) {
    throw new Error("Staging and production must use different deployments.");
  }

  if (!expectedOrigin || url !== expected) {
    throw new Error(
      "Convex URL must match the selected environment's configured deployment.",
    );
  }
};
