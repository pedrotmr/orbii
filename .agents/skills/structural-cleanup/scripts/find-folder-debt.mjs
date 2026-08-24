#!/usr/bin/env node
/**
 * Rank feature folders with flat sibling sprawl for structural-cleanup skill.
 */
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMPONENTS = path.resolve(
  __dirname,
  "../../../../apps/mobile/src/components",
);

const EXCLUDE = /(?:^|\/)(vendor|_generated)(?:\/|$)/;

async function walkDirs(dir, dirs = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const full = path.join(dir, entry.name);
    const rel = path.relative(COMPONENTS, full).replaceAll("\\", "/");
    if (EXCLUDE.test(`/${rel}/`)) continue;
    dirs.push(full);
    await walkDirs(full, dirs);
  }
  return dirs;
}

async function folderStats(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const tsxAtRoot = entries.filter(
    (e) => e.isFile() && e.name.endsWith(".tsx"),
  ).length;
  const subdirs = entries.filter((e) => e.isDirectory()).length;
  const rel = path.relative(COMPONENTS, dir).replaceAll("\\", "/");
  return { rel: `components/${rel}`, tsxAtRoot, subdirs };
}

const dirs = await walkDirs(COMPONENTS);
const ranked = [];

for (const dir of dirs) {
  const s = await folderStats(dir);
  if (s.tsxAtRoot < 5) continue;
  ranked.push({
    ...s,
    score: s.tsxAtRoot * 10 - s.subdirs * 3,
  });
}

ranked.sort((a, b) => b.score - a.score);

console.log("Structural cleanup — flat folder ranking (components/)\n");
console.log("Folders with 5+ .tsx siblings at the same level.\n");

for (let i = 0; i < Math.min(10, ranked.length); i++) {
  const f = ranked[i];
  console.log(
    `${i + 1}. ${f.rel}\n   .tsx at this level: ${f.tsxAtRoot} | subdirs: ${f.subdirs}\n`,
  );
}
