#!/usr/bin/env node
/**
 * Pick one structural-cleanup target for autonomous housekeeping runs.
 * Merges split debt (fat / multi-component files) with folder debt (flat sprawl).
 *
 * Usage:
 *   node pick-target.mjs           # highest combined score
 *   node pick-target.mjs --random  # random from top pool (for scheduled automation)
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOBILE_SRC = path.resolve(__dirname, "../../../../apps/mobile/src");
const POOL_SIZE = 8;

const EXCLUDE_DIR = /(?:^|\/)(vendor|_generated)(?:\/|$)/;
const EXCLUDE_FILE = /\.(test|spec)\.[tj]sx?$/;
const COMPONENT_RE = /^(?:export\s+default\s+)?function\s+([A-Z][A-Za-z0-9]*)\s*[\(<]/gm;

const random = process.argv.includes("--random");

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

function featureFolderFor(rel) {
  if (rel.startsWith("components/")) {
    const parts = rel.replace(/^components\//, "").split("/");
    return `apps/mobile/src/components/${parts[0]}`;
  }
  if (rel.startsWith("app/")) {
    const match = rel.match(/^app\/\(app\)\/(?:\(tabs\)\/)?([^/]+)/);
    if (match) return `apps/mobile/src/components/${match[1]}`;
  }
  return null;
}

const files = await walk(MOBILE_SRC);

const folderDebt = new Map();
for (const file of files) {
  const rel = path.relative(MOBILE_SRC, file).replaceAll("\\", "/");
  if (!rel.endsWith(".tsx")) continue;
  const dir = path.dirname(file);
  const dirRel = path.relative(MOBILE_SRC, dir).replaceAll("\\", "/");
  if (!dirRel.startsWith("components/")) continue;
  const key = `apps/mobile/src/${dirRel}`;
  folderDebt.set(key, (folderDebt.get(key) ?? 0) + 1);
}

const flatFolders = new Map();
for (const [folder, tsxCount] of folderDebt) {
  if (tsxCount >= 5) {
    flatFolders.set(folder, tsxCount * 10);
  }
}

const candidates = [];

for (const file of files) {
  if (!/\.tsx$/.test(file)) continue;
  const content = await readFile(file, "utf8");
  const lines = content.split("\n").length;
  const names = [...content.matchAll(COMPONENT_RE)].map((m) => m[1]);
  const components = names.length;
  if (components < 2 && lines < 180) continue;

  const rel = path.relative(MOBILE_SRC, file).replaceAll("\\", "/");
  const absRel = `apps/mobile/src/${rel}`;
  const inComponents = rel.startsWith("components/");
  const fileScore = lines * 1000 + components * 10 + (inComponents ? 1 : 0);

  const feature = featureFolderFor(rel);
  const parentDir = `apps/mobile/src/${path.dirname(rel).replaceAll("\\", "/")}`;
  const folderBonus = flatFolders.get(parentDir) ?? flatFolders.get(feature ?? "") ?? 0;

  candidates.push({
    pick: absRel,
    folder: feature ?? parentDir,
    score: fileScore + folderBonus,
    lines,
    components,
    names,
    reasons: [
      components >= 2 ? `${components} components (${names.join(", ")})` : null,
      lines >= 180 ? `${lines} lines` : null,
      folderBonus > 0 ? "flat parent folder" : null,
    ].filter(Boolean),
  });
}

for (const [folder, folderScore] of flatFolders) {
  const alreadyCovered = candidates.some((c) => c.folder === folder || c.pick.startsWith(folder));
  if (alreadyCovered) continue;

  candidates.push({
    pick: folder,
    folder,
    score: folderScore,
    lines: 0,
    components: 0,
    names: [],
    reasons: [`${folderDebt.get(folder.replace("apps/mobile/src/", "")) ?? "?"} sibling .tsx files`],
  });
}

candidates.sort((a, b) => b.score - a.score);
const pool = candidates.slice(0, POOL_SIZE);
const chosen = random
  ? pool[Math.floor(Math.random() * pool.length)]
  : pool[0];

if (!chosen) {
  console.log("No structural cleanup targets found.");
  process.exit(0);
}

console.log("Structural cleanup — pick target\n");
console.log(`MODE: ${random ? "random (automation pool)" : "highest score"}\n`);
console.log(`PICK: ${chosen.pick}`);
console.log(`FOLDER SCOPE: ${chosen.folder}`);
console.log(`REASON: ${chosen.reasons.join("; ")}`);
console.log(`SCORE: ${chosen.score}\n`);
console.log(`Pool (top ${pool.length}):`);
for (let i = 0; i < pool.length; i++) {
  const c = pool[i];
  const marker = c.pick === chosen.pick ? " ← PICK" : "";
  console.log(`  ${i + 1}. ${c.pick} — ${c.reasons.join("; ")}${marker}`);
}
