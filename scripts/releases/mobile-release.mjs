import { execFileSync } from "node:child_process";
import {
  appendFileSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { releaseConfig, repositoryDirectory } from "./config.mjs";
import {
  requireValue,
  selectStagingDelivery,
  validateBuild,
  validateChannel,
  validateContext,
  validateRelease,
  validateSubmission,
} from "./guards.mjs";
import { resolveNotes, resolveSource, runEas, runGit } from "./source.mjs";

const resolve = async () => {
  requireValue(process.env.EXPO_TOKEN, "GitHub EXPO_TOKEN secret");
  const source = await resolveSource({
    ref: process.env.RELEASE_SHA || undefined,
    version: process.env.RELEASE_VERSION || undefined,
    workflowSha: process.env.GITHUB_SHA,
  });
  validateRelease(source);
  if (runGit(["rev-parse", "HEAD"]) !== source.sha) {
    throw new Error("Checkout must match the selected release commit.");
  }
  validateSubmission(
    JSON.parse(
      readFileSync(
        join(repositoryDirectory, releaseConfig.mobileDirectory, "eas.json"),
        "utf8",
      ),
    ),
    releaseConfig,
    process.env.RELEASE_TARGET_ENVIRONMENT,
  );
  appendFileSync(
    requireValue(process.env.GITHUB_OUTPUT, "GitHub output file"),
    `sha=${source.sha}\nversion=${source.version}\n`,
  );
  console.log(`Selected ${source.sha}, app version ${source.version}.`);
};

const deliver = () => {
  const environment = process.env.RELEASE_TARGET_ENVIRONMENT;
  if (!["staging", "production"].includes(environment)) {
    throw new Error("Choose staging or production.");
  }
  const source = {
    sha: process.env.RELEASE_SHA,
    version: process.env.RELEASE_VERSION,
  };
  validateRelease(source);
  requireValue(process.env.EXPO_TOKEN, "GitHub EXPO_TOKEN secret");
  if (
    runGit(["rev-parse", "HEAD"]) !== source.sha ||
    runGit(["status", "--porcelain", "--untracked-files=no"])
  ) {
    throw new Error(
      "Delivery requires an unchanged checkout of the selected commit.",
    );
  }
  const staging = environment === "staging";
  const easEnvironment = staging ? "preview" : "production";
  const profile = staging
    ? releaseConfig.stagingProfile
    : releaseConfig.productionProfile;
  const channel = staging
    ? releaseConfig.stagingChannel
    : releaseConfig.productionChannel;
  if (process.env.APP_VARIANT !== (staging ? "preview" : "production")) {
    throw new Error("APP_VARIANT must match the target environment.");
  }
  const app = JSON.parse(
    execFileSync("pnpm", ["exec", "expo", "config", "--json"], {
      cwd: join(repositoryDirectory, releaseConfig.mobileDirectory),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
    }),
  );
  validateContext(app, releaseConfig, environment, source.version, process.env);
  let delivery = "testflight";
  if (staging) {
    const builds = runEas([
      "build:list",
      "--platform",
      "ios",
      "--status",
      "finished",
      "--distribution",
      "store",
      "--build-profile",
      profile,
      "--app-identifier",
      releaseConfig.stagingBundleIdentifier,
      "--channel",
      channel,
      "--limit",
      "1",
      "--json",
      "--non-interactive",
    ]);
    if (!Array.isArray(builds)) {
      throw new Error("EAS did not return the staging build list.");
    }
    const build = builds[0];
    let comparison;
    if (
      build?.appVersion === source.version &&
      build.runtime?.version === source.version
    ) {
      comparison = runEas([
        "fingerprint:compare",
        "--build-id",
        build.id,
        "--environment",
        easEnvironment,
        "--json",
        "--non-interactive",
      ]);
    }
    delivery = selectStagingDelivery(
      build,
      releaseConfig,
      source.version,
      comparison,
      process.env.STAGING_DELIVERY || "auto",
    );
  }
  const record = {
    ...source,
    environment,
    delivery,
    notes: resolveNotes(process.env.RELEASE_NOTES, source.sha),
    stage: "starting",
    githubRun: `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
  };
  const save = () => {
    mkdirSync(join(repositoryDirectory, ".release-artifacts"), {
      recursive: true,
    });
    writeFileSync(
      join(repositoryDirectory, ".release-artifacts/mobile-release.json"),
      `${JSON.stringify({ ...record, recordedAt: new Date().toISOString() }, null, 2)}\n`,
    );
  };
  try {
    save();
    if (delivery === "update") {
      validateChannel(
        runEas(["channel:view", channel, "--json", "--non-interactive"]),
        channel,
      );
      const updates = runEas([
        "update",
        "--platform",
        "ios",
        "--channel",
        channel,
        "--environment",
        easEnvironment,
        "--message",
        record.notes,
        "--json",
        "--non-interactive",
      ]);
      record.updates = updates.map(({ id, group }) => ({ id, group }));
      record.stage = "update-published";
    } else {
      const builds = runEas([
        "build",
        "--platform",
        "ios",
        "--profile",
        profile,
        "--wait",
        "--json",
        "--non-interactive",
      ]);
      if (!Array.isArray(builds) || builds.length !== 1) {
        throw new Error("EAS must return one iOS build.");
      }
      const build = runEas(["build:view", builds[0].id, "--json"]);
      validateBuild(build, releaseConfig, environment);
      if (
        build.gitCommitHash !== source.sha ||
        build.appVersion !== source.version ||
        build.runtime?.version !== source.version
      ) {
        throw new Error(
          "Built source, version, and runtime must match the selected commit.",
        );
      }
      record.build = { id: build.id, buildNumber: build.appBuildVersion };
      record.stage = "built";
      save();
      // EAS Submit has no JSON flag. Wait for the upload and retain the exact build ID.
      runEas(
        [
          "submit",
          "--platform",
          "ios",
          "--profile",
          profile,
          "--id",
          build.id,
          "--wait",
          "--non-interactive",
        ],
        false,
      );
      record.stage = "uploaded-to-app-store-connect";
    }
  } catch (error) {
    record.failedAt = record.stage;
    record.stage = "failed";
    throw error;
  } finally {
    save();
  }
  console.log(JSON.stringify(record, null, 2));
};

try {
  if (process.argv[2] === "resolve") {
    await resolve();
  } else if (process.argv[2] === "deliver") {
    deliver();
  } else {
    throw new Error("Expected resolve or deliver.");
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
