#!/usr/bin/env node
/**
 * Pick one house-style target for autonomous housekeeping runs.
 *
 * Usage:
 *   node pick-target.mjs           # highest house-style debt score
 *   node pick-target.mjs --random  # random from top pool (scheduled automation)
 */
import { collectCandidates } from "./house-style-debt-utils.mjs";

const POOL_SIZE = 8;
const random = process.argv.includes("--random");

const candidates = await collectCandidates();
const pool = candidates.slice(0, POOL_SIZE);
const chosen = random
  ? pool[Math.floor(Math.random() * pool.length)]
  : pool[0];

if (!chosen) {
  console.log("No house-style targets found.");
  process.exit(0);
}

console.log("House style — pick target\n");
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
