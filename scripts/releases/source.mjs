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
  const version = config?.expo?.version;
  if (!/^\d+\.\d+\.\d+$/.test(version ?? "")) {
    throw new Error(
      "The committed version file must declare expo.version such as 1.2.0.",
    );
  }
  return version;
};

export const resolveSource = async (
  { ref, version, dryRun = false, workflowSha },
  { git = runGit, readVersion = readCommittedVersion } = {},
) => {
  let selectedRef = ref || workflowSha;
  if (!selectedRef) {
    if (!dryRun) {
      git([
        "fetch",
        "--no-tags",
        releaseConfig.gitRemote,
        `+refs/heads/${releaseConfig.defaultBranch}:refs/remotes/${releaseConfig.gitRemote}/${releaseConfig.defaultBranch}`,
      ]);
    }
    selectedRef = `refs/remotes/${releaseConfig.gitRemote}/${releaseConfig.defaultBranch}`;
  }

  if (selectedRef.startsWith("-")) {
    throw new Error("The release ref cannot start with a dash.");
  }
  const sha = git(["rev-parse", "--verify", `${selectedRef}^{commit}`]);
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
