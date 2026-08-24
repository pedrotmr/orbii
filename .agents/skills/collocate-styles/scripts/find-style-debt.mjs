#!/usr/bin/env node
/**
 * Rank apps/mobile *-styles.ts files by colocation opportunity.
 * Maps each style key to consumer files; flags private vs shared keys.
 */
import path from "node:path";
import {
  MOBILE_SRC,
  STYLE_FILE_RE,
  auditStyleFile,
  walk,
} from "./style-audit-utils.mjs";

const allFiles = await walk(MOBILE_SRC);
const styleFiles = allFiles.filter((file) => STYLE_FILE_RE.test(path.basename(file)));

const ranked = [];

for (const styleFile of styleFiles) {
  const audit = await auditStyleFile(styleFile, allFiles);
  if (!audit) continue;

  const {
    styleRel,
    featureRoot,
    lines,
    keys,
    consumers,
    privateKeys,
    sharedKeys,
    orphanKeys,
    privateRatio,
  } = audit;

  const score =
    lines * 100 +
    keys.length * 20 +
    privateKeys.length * 80 +
    Math.round(privateRatio * 500);

  ranked.push({
    styleFile: `apps/mobile/src/${styleRel}`,
    feature: `apps/mobile/src/${featureRoot}`,
    lines,
    keys: keys.length,
    consumers,
    privateKeys,
    sharedKeys,
    orphanKeys,
    privateRatio,
    score,
  });
}

ranked.sort((a, b) => b.score - a.score);

console.log("Collocate styles — style-file ranking (apps/mobile)\n");
console.log("High private-key ratio = more keys can move beside one component.\n");

const top = ranked.slice(0, 12);
for (let i = 0; i < top.length; i++) {
  const row = top[i];
  const pct = Math.round(row.privateRatio * 100);
  console.log(
    `${i + 1}. ${row.styleFile}\n` +
      `   lines: ${row.lines} | keys: ${row.keys} | consumers: ${row.consumers}\n` +
      `   private: ${row.privateKeys.length} (${pct}%) | shared: ${row.sharedKeys.length} | orphan: ${row.orphanKeys.length}\n` +
      `   score: ${row.score}\n`,
  );
}

if (top[0]?.privateKeys.length > 0) {
  console.log("Sample private keys (first file):");
  for (const { key, file } of top[0].privateKeys.slice(0, 8)) {
    console.log(`  ${key} → ${file}`);
  }
  if (top[0].privateKeys.length > 8) {
    console.log(`  … +${top[0].privateKeys.length - 8} more`);
  }
}
