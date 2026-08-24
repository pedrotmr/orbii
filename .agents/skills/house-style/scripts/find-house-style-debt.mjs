#!/usr/bin/env node
/**
 * Rank files by house-style debt score (diagnostics).
 */
import { collectCandidates } from "./house-style-debt-utils.mjs";

const candidates = await collectCandidates();
const top = candidates.slice(0, 15);

console.log("House style — debt ranking\n");
console.log("Pick #1 unless the user named a file.\n");

if (top.length === 0) {
  console.log("No house-style debt targets found.");
  process.exit(0);
}

for (let i = 0; i < top.length; i++) {
  const f = top[i];
  console.log(
    `${i + 1}. ${f.pick}\n   score: ${f.score} | lines: ${f.lines}\n   ${f.reasons.join("; ")}\n   folder: ${f.folder}\n`,
  );
}
