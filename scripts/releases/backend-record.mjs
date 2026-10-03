import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { repositoryDirectory } from "./config.mjs";

const main = () => {
  const sha = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: repositoryDirectory,
    encoding: "utf8",
  }).trim();
  const environment = process.env.RELEASE_TARGET_ENVIRONMENT;

  if (
    !/^[a-f\d]{40}$/i.test(process.env.RELEASE_SHA ?? "") ||
    sha !== process.env.RELEASE_SHA
  ) {
    throw new Error("Backend deployment requires the exact selected commit.");
  }

  if (!["staging", "production"].includes(environment)) {
    throw new Error("Backend environment must be staging or production.");
  }

  if (process.argv[2] === "verify") {
    return;
  }

  if (process.argv[2] !== "record") {
    throw new Error("Expected verify or record.");
  }

  const directory = join(repositoryDirectory, ".release-artifacts");
  mkdirSync(directory, { recursive: true });
  const record = {
    sha,
    environment,
    stage: "backend-deployed",
    githubRun: `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
    recordedAt: new Date().toISOString(),
  };
  writeFileSync(
    join(directory, "backend-release.json"),
    `${JSON.stringify(record, null, 2)}\n`,
  );
  console.log(JSON.stringify(record, null, 2));
};

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
