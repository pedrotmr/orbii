#!/usr/bin/env node
/**
 * Scan Mira La Cancha for style consolidation opportunities.
 * Usage (from repo root): node .agents/skills/design-system-audit/scripts/audit-styles.mjs [--path <dir>] [--json]
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const DEFAULT_PATHS = ["apps/mobile/src", "apps/web/src"];
const SKIP_DIRS = new Set(["node_modules", "vendor", ".turbo", "_generated"]);
const EXT = new Set([".tsx", ".ts"]);

const args = process.argv.slice(2);
const jsonOut = args.includes("--json");
const pathIdx = args.indexOf("--path");
const scanRoots =
  pathIdx >= 0 && args[pathIdx + 1]
    ? [join(ROOT, args[pathIdx + 1])]
    : DEFAULT_PATHS.map((p) => join(ROOT, p));

const TONE_MAP = {
  "theme.colors.text.primary": "primary",
  "theme.colors.text.secondary": "secondary",
  "theme.colors.text.tertiary": "tertiary",
  "theme.colors.text.inverse": "inverse",
  "theme.colors.brand.primary": "brand",
  "theme.colors.accent.error": "error",
  "theme.colors.accent.success": "success",
};

const SIZE_MAP = {
  "theme.typography.fontSize.xs": "xs",
  "theme.typography.fontSize.sm": "sm",
  "theme.typography.fontSize.base": "base",
  "theme.typography.fontSize.md": "md",
  "theme.typography.fontSize.lg": "lg",
  'theme.typography.fontSize["3xl"]': "3xl",
};

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files);
    else if (EXT.has(name.slice(name.lastIndexOf(".")))) files.push(full);
  }
  return files;
}

function suggestTextVariant(props) {
  const fs = props.fontSize;
  const fw = props.fontWeight?.replace(/['"]/g, "");
  const color = props.color;
  const tone = TONE_MAP[color];
  const size = SIZE_MAP[fs];

  if (size === "sm" && fw === "600" && tone) {
    return `variant="caption" tone="${tone}"`;
  }
  if (size === "md" && fw === "500" && (tone === "primary" || !tone)) {
    return `variant="body"${tone ? ` tone="${tone}"` : ""}`;
  }
  if (size === "lg" && fw === "700") {
    return `variant="subtitle"${tone ? ` tone="${tone}"` : ""}`;
  }
  if (size === "3xl" && fw === "700") {
    return `variant="title"${tone ? ` tone="${tone}"` : ""}`;
  }
  if (props.textTransform === "uppercase" && (size === "xs" || fs === "10")) {
    return `variant="meta"${tone ? ` tone="${tone}"` : ""}`;
  }
  return null;
}

function parseStyleBlock(content, key) {
  const re = new RegExp(`${key}:\\s*\\{([^}]+)\\}`, "s");
  const m = content.match(re);
  if (!m) return null;
  const body = m[1];
  const props = {};
  for (const line of body.split("\n")) {
    const kv = line.match(/^\s*(\w+):\s*(.+?),?\s*$/);
    if (kv) props[kv[1]] = kv[2].trim();
  }
  return props;
}

function fingerprint(props) {
  const norm = {};
  if (props.fontSize) norm.fontSize = SIZE_MAP[props.fontSize] ?? props.fontSize;
  if (props.fontWeight)
    norm.fontWeight = props.fontWeight.replace(/['"]/g, "");
  if (props.color) norm.color = TONE_MAP[props.color] ?? props.color;
  if (props.textTransform)
    norm.textTransform = props.textTransform.replace(/['"]/g, "");
  return JSON.stringify(norm, Object.keys(norm).sort());
}

/** One parent folder per run — feature components, tab routes, or web app group. */
function scopeBucket(file) {
  const parts = file.split("/");
  if (parts[0] === "apps" && parts[1] === "mobile" && parts[2] === "src") {
    if (parts[3] === "components" && parts[4]) {
      return parts.slice(0, 5).join("/");
    }
    if (parts[3] === "app") {
      const tabsIdx = parts.indexOf("(tabs)");
      if (tabsIdx >= 0 && parts[tabsIdx + 1]) {
        return parts.slice(0, tabsIdx + 2).join("/");
      }
      return parts.slice(0, 4).join("/");
    }
  }
  if (parts[0] === "apps" && parts[1] === "web" && parts[2] === "src" && parts[3] === "app") {
    const segment = parts[4];
    if (segment && !segment.includes(".")) {
      return parts.slice(0, 5).join("/");
    }
    return parts.slice(0, 4).join("/");
  }
  return parts.slice(0, 3).join("/");
}

function bumpFolder(map, file, field) {
  const bucket = scopeBucket(file);
  const row = map.get(bucket) ?? {
    dropIns: 0,
    textStyle: 0,
    hardcoded: 0,
    files: new Set(),
  };
  row[field]++;
  row.files.add(file);
  map.set(bucket, row);
}

const findings = {
  textStyleWithoutVariant: [],
  styleKeySuggestions: [],
  hardcodedColors: [],
  duplicateFingerprints: new Map(),
};
const folderScores = new Map();

for (const root of scanRoots) {
  let files;
  try {
    files = walk(root);
  } catch {
    continue;
  }

  for (const file of files) {
    const rel = relative(ROOT, file);
    const content = readFileSync(file, "utf8");

  // <Text style={...}> without variant prop on same tag
    const textStyleRe = /<Text\b([^>]*)\bstyle=\{([^}]+)\}/g;
    let m;
    while ((m = textStyleRe.exec(content))) {
      const attrs = m[1];
      if (!/\bvariant=/.test(attrs)) {
        const line = content.slice(0, m.index).split("\n").length;
        findings.textStyleWithoutVariant.push({ file: rel, line, style: m[2].trim() });
        bumpFolder(folderScores, rel, "textStyle");
      }
    }

    // StyleSheet keys → variant suggestions
    const keyRe = /(\w+):\s*\{/g;
    while ((m = keyRe.exec(content))) {
      const key = m[1];
      if (!content.includes("StyleSheet.create")) continue;
      const props = parseStyleBlock(content, key);
      if (!props?.fontSize && !props?.color) continue;
      const suggestion = suggestTextVariant(props);
      const fp = fingerprint(props);
      if (fp !== "{}") {
        const list = findings.duplicateFingerprints.get(fp) ?? [];
        list.push({ file: rel, key });
        findings.duplicateFingerprints.set(fp, list);
      }
      if (suggestion) {
        findings.styleKeySuggestions.push({ file: rel, key, suggestion, props });
        bumpFolder(folderScores, rel, "dropIns");
      }
    }

    // Hardcoded colors (skip theme imports usage)
    const colorRe = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/g;
    while ((m = colorRe.exec(content))) {
      const line = content.slice(0, m.index).split("\n").length;
      const lineText = content.split("\n")[line - 1] ?? "";
      if (lineText.includes("shadowColor")) continue;
      findings.hardcodedColors.push({ file: rel, line, value: m[1] });
      bumpFolder(folderScores, rel, "hardcoded");
    }
  }
}

const folderRanking = [...folderScores.entries()]
  .map(([folder, s]) => ({
    folder,
    dropIns: s.dropIns,
    textStyle: s.textStyle,
    hardcoded: s.hardcoded,
    fileCount: s.files.size,
    score: s.dropIns * 3 + s.textStyle + s.hardcoded,
  }))
  .filter((r) => r.score > 0)
  .sort((a, b) => b.score - a.score || b.dropIns - a.dropIns);

const duplicates = [...findings.duplicateFingerprints.entries()]
  .filter(([, sites]) => {
    const files = new Set(sites.map((s) => s.file));
    return files.size >= 2;
  })
  .map(([fp, sites]) => ({ fingerprint: JSON.parse(fp), sites }));

if (jsonOut) {
  console.log(
    JSON.stringify(
      {
        textStyleWithoutVariant: findings.textStyleWithoutVariant,
        styleKeySuggestions: findings.styleKeySuggestions,
        hardcodedColors: findings.hardcodedColors,
        duplicateFingerprints: duplicates,
        folderRanking,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

console.log("# Design system audit\n");
console.log(`Scanned: ${scanRoots.map((p) => relative(ROOT, p)).join(", ")}\n`);

console.log("## By folder — pick ONE scope for this run\n");
for (const r of folderRanking.slice(0, 12)) {
  console.log(
    `  ${r.folder}  score=${r.score}  drop-ins=${r.dropIns}  text-style=${r.textStyle}  files=${r.fileCount}`,
  );
}
if (folderRanking[0]) {
  console.log(`\n  → suggested: ${folderRanking[0].folder}`);
  console.log(
    `    node .agents/skills/design-system-audit/scripts/audit-styles.mjs --path ${folderRanking[0].folder}`,
  );
}
console.log();

console.log(`## Text with style= but no variant (${findings.textStyleWithoutVariant.length})`);
for (const f of findings.textStyleWithoutVariant.slice(0, 40)) {
  console.log(`  ${f.file}:${f.line}  style=${f.style}`);
}
if (findings.textStyleWithoutVariant.length > 40) {
  console.log(`  … and ${findings.textStyleWithoutVariant.length - 40} more`);
}

console.log(`\n## StyleSheet keys → Text primitive (${findings.styleKeySuggestions.length})`);
for (const s of findings.styleKeySuggestions.slice(0, 30)) {
  console.log(`  ${s.file}  ${s.key}  →  <Text ${s.suggestion}>`);
}
if (findings.styleKeySuggestions.length > 30) {
  console.log(`  … and ${findings.styleKeySuggestions.length - 30} more`);
}

console.log(`\n## Duplicate style fingerprints across files (${duplicates.length})`);
for (const d of duplicates.slice(0, 15)) {
  const locs = d.sites.map((s) => `${s.file}#${s.key}`).join(", ");
  console.log(`  ${JSON.stringify(d.fingerprint)}`);
  console.log(`    ${locs}`);
}

console.log(`\n## Hardcoded colors (${findings.hardcodedColors.length})`);
for (const h of findings.hardcodedColors.slice(0, 20)) {
  console.log(`  ${h.file}:${h.line}  ${h.value}`);
}
if (findings.hardcodedColors.length > 20) {
  console.log(`  … and ${findings.hardcodedColors.length - 20} more`);
}
