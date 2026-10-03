import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { releaseConfig, repositoryDirectory } from "./config.mjs";
import { parseEasJson } from "./eas-json.mjs";

export const runGit = (args) =>
  execFileSync("git", args, {
    cwd: repositoryDirectory,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  }).trim();

export const runEas = (args, json = true) => {
  const output = execFileSync(
    "pnpm",
    ["dlx", `eas-cli@${releaseConfig.easCliVersion}`, ...args],
    {
      cwd: join(repositoryDirectory, releaseConfig.mobileDirectory),
      encoding: "utf8",
      stdio: ["ignore", json ? "pipe" : "inherit", "inherit"],
      maxBuffer: 32 * 1024 * 1024,
    },
  );
  return json ? parseEasJson(output) : undefined;
};

export const readCommittedVersion = async (
  sha,
  git = runGit,
  versionFile = releaseConfig.versionFile,
) => {
  const source = git(["show", `${sha}:${versionFile}`]);
  // Dynamic Expo configs can keep their version in app.json instead.
  const config = versionFile.endsWith(".json")
    ? JSON.parse(source)
    : (
        await import(
          `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
        )
      ).default;
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new Error(
      "The version file must be JSON or a self-contained JavaScript Expo object; function configs must keep the version in app.json.",
    );
  }
  const version = config?.expo?.version;
  if (!/^\d+\.\d+\.\d+$/.test(version ?? "")) {
    throw new Error(
      "The committed version file must declare expo.version such as 1.2.0.",
    );
  }
  return version;
};

export const assertMainCommit = (sha, git = runGit) => {
  if (!/^[a-f\d]{40}$/i.test(sha ?? "")) {
    throw new Error("Select a full 40-character commit SHA.");
  }
  const mainRef = `refs/remotes/${releaseConfig.gitRemote}/${releaseConfig.defaultBranch}`;
  try {
    git(["merge-base", "--is-ancestor", sha.toLowerCase(), mainRef]);
  } catch {
    throw new Error(
      `The release commit must be on ${releaseConfig.defaultBranch}. Fetch full main history before verifying.`,
    );
  }
};

export const assertLatestMainCommit = (sha, git = runGit) => {
  const mainSha = git([
    "rev-parse",
    `refs/remotes/${releaseConfig.gitRemote}/${releaseConfig.defaultBranch}`,
  ]);
  if (sha.toLowerCase() !== mainSha.toLowerCase()) {
    throw new Error(
      "Automatic staging requires the latest main commit; rerun staging manually to select an older revision.",
    );
  }
};

export const resolveSource = async (
  { ref, version, dryRun = false, workflowSha },
  { git = runGit, readVersion = readCommittedVersion } = {},
) => {
  const mainRef = `refs/remotes/${releaseConfig.gitRemote}/${releaseConfig.defaultBranch}`;
  const selectedRef = ref || workflowSha || mainRef;
  if (selectedRef.startsWith("-")) {
    throw new Error("The release ref cannot start with a dash.");
  }

  // CI checkout fetched authenticated history; local live commands refresh main.
  if (!dryRun && !workflowSha) {
    git([
      "fetch",
      "--no-tags",
      releaseConfig.gitRemote,
      `+refs/heads/${releaseConfig.defaultBranch}:${mainRef}`,
    ]);
  }
  const sha = git(["rev-parse", "--verify", `${selectedRef}^{commit}`]);
  assertMainCommit(sha, git);
  const committedVersion = await readVersion(sha, git);
  if (version && version !== committedVersion) {
    throw new Error(
      "The requested version does not match the selected commit's app version.",
    );
  }
  return { sha, version: committedVersion };
};

export const resolveNotes = (notes, sha, git = runGit) => {
  if (typeof notes === "string" && notes.trim()) {
    return notes;
  }

  if (!/^[a-f\d]{40}$/i.test(sha ?? "")) {
    throw new Error("Select a full 40-character commit SHA.");
  }
  const subject = git(["show", "-s", "--format=%s", sha])
    .replace(/[\r\n]+/g, " ")
    .trim();
  return `Automatic: ${subject || "Release"} (${sha.slice(0, 7)})`;
};
