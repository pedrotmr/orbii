import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const repositoryDirectory = fileURLToPath(
  new URL("../../", import.meta.url),
);
export const releaseConfig = JSON.parse(
  readFileSync(new URL("../../release.config.json", import.meta.url), "utf8"),
);
