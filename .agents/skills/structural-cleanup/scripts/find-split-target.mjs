#!/usr/bin/env node
/**
 * Rank apps/mobile files by structural-debt score for structural-cleanup skill.
 * Excludes vendor/, tests, generated paths.
 */
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOBILE_SRC = path.resolve(__dirname, "../../../../apps/mobile/src");

const EXCLUDE_DIR = /(?:^|\/)(vendor|_generated)(?:\/|$)/;
const EXCLUDE_FILE = /\.(test|spec)\.[tj]sx?$/;

const COMPONENT_RE = /^(?:export\s+default\s+)?function\s+([A-Z][A-Za-z0-9]*)\s*[\(<]/gm;

async function walk(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(MOBILE_SRC, full).replaceAll("\\", "/");
    if (EXCLUDE_DIR.test(`/${rel}/`)) continue;
    if (entry.isDirectory()) {
      await walk(full, files);
    } else if (/\.(tsx|ts)$/.test(entry.name) && !EXCLUDE_FILE.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function scoreFile(rel, lines, components) {
  const inComponents = rel.startsWith("components/");
  // Prefer components/ over app/ when scores are close (small bonus)
  const locationBonus = inComponents ? 1 : 0;
  return lines * 1000 + components * 10 + locationBonus;
}

const files = await walk(MOBILE_SRC);
const ranked = [];

for (const file of files) {
  const content = await readFile(file, "utf8");
  const lines = content.split("\n").length;
  const components = [...content.matchAll(COMPONENT_RE)].map((m) => m[1]);
  const rel = path.relative(MOBILE_SRC, file).replaceAll("\\", "/");
  ranked.push({
    rel: `apps/mobile/src/${rel}`,
    lines,
    components: components.length,
    names: components,
    score: scoreFile(rel, lines, components.length),
    inComponents: rel.startsWith("components/"),
  });
}

ranked.sort((a, b) => b.score - a.score);

console.log("Structural cleanup — split target ranking (apps/mobile)\n");
console.log("Pick #1 unless the user named a file.\n");

const top = ranked.slice(0, 10);
for (let i = 0; i < top.length; i++) {
  const f = top[i];
  const comps =
    f.components > 0
      ? ` | components: ${f.components} (${f.names.join(", ")})`
      : " | components: 0";
  console.log(
    `${i + 1}. ${f.rel}\n   lines: ${f.lines}${comps}\n   area: ${f.inComponents ? "components" : "app/other"}\n`,
  );
}
