import { execFileSync } from "node:child_process";
import { parseArgs } from "node:util";
import { releaseConfig, repositoryDirectory } from "./config.mjs";
import { validateRelease } from "./guards.mjs";
import { resolveNotes, resolveSource } from "./source.mjs";

try {
  const { values } = parseArgs({
    args: process.argv.slice(2).filter((argument) => argument !== "--"),
    options: {
      environment: { type: "string", default: "production" },
      action: { type: "string", default: "testflight" },
      ref: { type: "string" },
      version: { type: "string" },
      notes: { type: "string" },
      "dry-run": { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
  });
  if (values.help) {
    console.log(`Usage: pnpm mobile:testflight:staging | pnpm mobile:testflight:production
Selects latest pushed main and reads its committed app version.
Optional: --ref <commit-or-tag>, --version <assertion>, --notes <text>, --dry-run.
Dry runs are offline and use cached origin/main. Local changes are never uploaded.`);
  } else {
    if (
      !["staging", "production"].includes(values.environment) ||
      values.action !== "testflight"
    ) {
      throw new Error(
        "Choose staging or production; the supported action is testflight.",
      );
    }
    const source = await resolveSource({
      ...values,
      dryRun: values["dry-run"],
    });
    validateRelease(source);
    const workflow =
      values.environment === "staging"
        ? releaseConfig.stagingWorkflow
        : releaseConfig.githubWorkflow;
    const inputs = {
      release_sha: source.sha,
      notes: resolveNotes(values.notes, source.sha),
      ...(values.environment === "staging"
        ? { delivery: "testflight" }
        : { app_version: source.version }),
    };
    if (values["dry-run"]) {
      console.log(JSON.stringify({ workflow, source, inputs }, null, 2));
    } else {
      execFileSync(
        "gh",
        [
          "workflow",
          "run",
          workflow,
          "--ref",
          releaseConfig.defaultBranch,
          "--json",
        ],
        {
          cwd: repositoryDirectory,
          input: JSON.stringify(inputs),
          stdio: ["pipe", "inherit", "inherit"],
        },
      );
      console.log(
        `Started ${values.environment} TestFlight for ${source.sha}, version ${source.version}. Follow with gh run list.`,
      );
    }
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
