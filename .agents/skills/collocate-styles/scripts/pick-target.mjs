#!/usr/bin/env node
/**
 * Pick one collocate-styles target for autonomous runs.
 *
 * Usage:
 *   node pick-target.mjs           # highest colocation score
 *   node pick-target.mjs --random  # random from top pool (scheduled automation)
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  MOBILE_SRC,
  STYLE_FILE_RE,
  auditStyleFile,
  walk,
} from "./style-audit-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POOL_SIZE = 8;
const MIN_KEYS = 6;

const random = process.argv.includes("--random");

const allFiles = await walk(MOBILE_SRC);
const styleFiles = allFiles.filter((file) => STYLE_FILE_RE.test(path.basename(file)));
const candidates = [];

for (const styleFile of styleFiles) {
  const audit = await auditStyleFile(styleFile, allFiles);
  if (!audit) continue;

  const {
    styleRel,
    featureRoot,
    lines,
    keys,
    privateCount,
    sharedCount,
    privateRatio,
    privateByFile,
  } = audit;

  const largeEligible = keys.length >= MIN_KEYS && privateCount >= 2;
  const smallAllPrivate =
    keys.length < MIN_KEYS && privateCount === keys.length && privateCount >= 1;
  if (!largeEligible && !smallAllPrivate) continue;

  const score =
    lines * 100 +
    keys.length * 20 +
    privateCount * 80 +
    Math.round(privateRatio * 500) +
    (smallAllPrivate ? 2000 : 0);

  const topRecipient = [...privateByFile.entries()].sort((a, b) => b[1] - a[1])[0];

  candidates.push({
    pick: `apps/mobile/src/${styleRel}`,
    folder: `apps/mobile/src/${featureRoot}`,
    lines,
    keys: keys.length,
    privateCount,
    sharedCount,
    privateRatio,
    score,
    topRecipient: topRecipient ? `${topRecipient[1]} keys → ${topRecipient[0]}` : null,
    reasons: [
      `${keys.length} style keys`,
      `${privateCount} private (${Math.round(privateRatio * 100)}%)`,
      smallAllPrivate ? "small all-private file" : null,
      sharedCount > 0 ? `${sharedCount} shared` : null,
      lines >= 120 ? `${lines} lines` : null,
    ].filter(Boolean),
  });
}

candidates.sort((a, b) => b.score - a.score);
const pool = candidates.slice(0, POOL_SIZE);
const chosen = random
  ? pool[Math.floor(Math.random() * pool.length)]
  : pool[0];

if (!chosen) {
  console.log(
    "No colocate-styles targets found (need ≥6 keys with ≥2 private, or a small all-private file).",
  );
  process.exit(0);
}

console.log("Collocate styles — pick target\n");
console.log(`MODE: ${random ? "random (automation pool)" : "highest score"}\n`);
console.log(`PICK: ${chosen.pick}`);
console.log(`FOLDER SCOPE: ${chosen.folder}`);
console.log(`REASON: ${chosen.reasons.join("; ")}`);
if (chosen.topRecipient) console.log(`HINT: ${chosen.topRecipient}`);
console.log(`SCORE: ${chosen.score}\n`);
console.log(`Pool (top ${pool.length}):`);
for (let i = 0; i < pool.length; i++) {
  const candidate = pool[i];
  const marker = candidate.pick === chosen.pick ? " ← PICK" : "";
  console.log(`  ${i + 1}. ${candidate.pick} — ${candidate.reasons.join("; ")}${marker}`);
}
