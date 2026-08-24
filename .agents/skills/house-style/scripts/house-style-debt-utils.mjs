#!/usr/bin/env node
/**
 * Shared house-style debt heuristics for the house-style skill.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const MOBILE_SRC = path.resolve(__dirname, "../../../../apps/mobile/src");
export const BACKEND_SRC = path.resolve(
  __dirname,
  "../../../../packages/backend/convex",
);

export const EXCLUDE_DIR = /(?:^|\/)(vendor|_generated|__tests__)(?:\/|$)/;
export const EXCLUDE_FILE = /\.(test|spec)\.[tj]sx?$/;

const isWs = (c) => c === " " || c === "\t" || c === "\n" || c === "\r";

const isIdentChar = (c) =>
  (c >= "A" && c <= "Z") ||
  (c >= "a" && c <= "z") ||
  (c >= "0" && c <= "9") ||
  c === "_" ||
  c === "$";

/** Strip comments and string/template literals so `?` inside them is ignored. */
export const stripCommentsAndStrings = (content) => {
  let out = "";
  let i = 0;
  while (i < content.length) {
    const c = content[i];
    const next = content[i + 1];

    if (c === "/" && next === "/") {
      out += "  ";
      i += 2;
      while (i < content.length && content[i] !== "\n") {
        out += " ";
        i += 1;
      }
      continue;
    }

    if (c === "/" && next === "*") {
      out += "  ";
      i += 2;
      while (i < content.length && !(content[i] === "*" && content[i + 1] === "/")) {
        out += content[i] === "\n" ? "\n" : " ";
        i += 1;
      }
      if (i < content.length) {
        out += "  ";
        i += 2;
      }
      continue;
    }

    if (c === "'" || c === '"' || c === "`") {
      const quote = c;
      out += " ";
      i += 1;
      while (i < content.length && content[i] !== quote) {
        if (content[i] === "\\" && i + 1 < content.length) {
          out += "  ";
          i += 2;
          continue;
        }

        if (quote === "`" && content[i] === "$" && content[i + 1] === "{") {
          out += "  ";
          i += 2;
          let depth = 1;
          while (i < content.length && depth > 0) {
            if (content[i] === "{") {
              depth += 1;
            } else if (content[i] === "}") {
              depth -= 1;
            }
            out += content[i] === "\n" ? "\n" : " ";
            i += 1;
          }
          continue;
        }

        out += content[i] === "\n" ? "\n" : " ";
        i += 1;
      }
      if (i < content.length) {
        out += " ";
        i += 1;
      }
      continue;
    }

    out += c;
    i += 1;
  }
  return out;
};

export const isTernaryQuestion = (src, i) => {
  if (src[i] !== "?") {
    return false;
  }

  const prev = src[i - 1];
  const next = src[i + 1];
  if (next === "?" || next === "." || prev === "?") {
    return false;
  }

  let j = i + 1;
  while (j < src.length && isWs(src[j])) {
    j += 1;
  }

  if (src[j] === ":") {
    return false;
  }

  return true;
};

const OPEN = { "(": ")", "[": "]", "{": "}" };
const CLOSE = { ")": true, "]": true, "}": true };

const findMatchingColon = (src, afterQ, end) => {
  let depth = 0;
  for (let j = afterQ; j < end; j++) {
    const c = src[j];
    if (OPEN[c]) {
      depth += 1;
      continue;
    }

    if (CLOSE[c]) {
      if (depth === 0) {
        return -1;
      }

      depth -= 1;
      continue;
    }

    if (c === ":" && depth === 0) {
      return j;
    }
  }
  return -1;
};

const findExprEnd = (src, start, end) => {
  let depth = 0;
  let j = start;
  while (j < end) {
    if (isTernaryQuestion(src, j) && depth === 0) {
      const colon = findMatchingColon(src, j + 1, end);
      if (colon === -1) {
        j += 1;
        continue;
      }

      j = findExprEnd(src, colon + 1, end);
      continue;
    }

    const c = src[j];
    if (OPEN[c]) {
      depth += 1;
      j += 1;
      continue;
    }

    if (CLOSE[c]) {
      if (depth === 0) {
        return j;
      }

      depth -= 1;
      j += 1;
      continue;
    }

    if (depth === 0 && (c === "," || c === ";")) {
      return j;
    }

    j += 1;
  }
  return end;
};

const matchingClose = (src, openAt, end) => {
  if (!OPEN[src[openAt]]) {
    return -1;
  }

  let depth = 0;
  for (let j = openAt; j < end; j++) {
    if (OPEN[src[j]]) {
      depth += 1;
      continue;
    }

    if (CLOSE[src[j]]) {
      depth -= 1;
      if (depth === 0) {
        return src[j] === OPEN[src[openAt]] ? j : -1;
      }
    }
  }
  return -1;
};

const startsWithJsx = (src, start, end) => {
  let i = start;
  while (i < end && isWs(src[i])) {
    i += 1;
  }

  return src[i] === "<" || src[i] === "{";
};

const unwrapNonJsxParens = (src, start, end) => {
  let s = start;
  let e = end;
  while (s < e) {
    while (s < e && isWs(src[s])) {
      s += 1;
    }

    while (e > s && isWs(src[e - 1])) {
      e -= 1;
    }

    if (src[s] !== "(" || src[e - 1] !== ")") {
      break;
    }

    if (matchingClose(src, s, e) !== e - 1) {
      break;
    }

    if (startsWithJsx(src, s + 1, e - 1)) {
      break;
    }

    s += 1;
    e -= 1;
  }
  return [s, e];
};

/**
 * True when this branch *is* another ternary (`a ? b : c ? d : e`), not when
 * a JSX tree in the branch happens to contain a separate one-level ternary.
 */
const branchIsChainedTernary = (src, start, end) => {
  const [rawStart, rawEnd] = unwrapNonJsxParens(src, start, end);
  let s = rawStart;
  const e = rawEnd;
  while (s < e && isWs(src[s])) {
    s += 1;
  }

  if (s >= e) {
    return false;
  }

  if (src[s] === "<" || src[s] === "{") {
    return false;
  }

  if (src[s] === "(" && startsWithJsx(src, s + 1, e)) {
    return false;
  }

  let depth = 0;
  for (let i = s; i < e; i++) {
    const c = src[i];
    if (OPEN[c]) {
      depth += 1;
      continue;
    }

    if (CLOSE[c]) {
      if (depth === 0) {
        return false;
      }

      depth -= 1;
      continue;
    }

    if (depth === 0 && (c === "{" || c === "<")) {
      return false;
    }

    if (depth === 0 && isTernaryQuestion(src, i)) {
      return true;
    }
  }
  return false;
};

/**
 * Count chained/nested ternaries (`a ? b : c ? d : e`).
 * One-level `cond ? a : b` and `{cond ? (jsx) : null}` are not nested, even
 * when a JSX branch contains another one-level ternary as a child.
 */
export const countNestedTernaries = (content) => {
  const src = stripCommentsAndStrings(content);
  let nested = 0;
  let i = 0;
  while (i < src.length) {
    if (!isTernaryQuestion(src, i)) {
      i += 1;
      continue;
    }

    const colon = findMatchingColon(src, i + 1, src.length);
    if (colon === -1) {
      i += 1;
      continue;
    }

    const falseEnd = findExprEnd(src, colon + 1, src.length);
    if (
      branchIsChainedTernary(src, i + 1, colon) ||
      branchIsChainedTernary(src, colon + 1, falseEnd)
    ) {
      nested += 1;
    }

    i = colon + 1;
  }
  return nested;
};

/**
 * Binary `let x = a; if (cond) { x = b; }` with no `else` and nothing else in
 * the if body. Prefer `const x = cond ? b : a`.
 * Skip gated fetch/validate blocks (`await`, extra statements, throws).
 */
export const countLetIfReassignments = (content) => {
  const src = stripCommentsAndStrings(content);
  const re =
    /\blet\s+([A-Za-z_$][\w$]*)\s*=[^;]*;\s*(?:\n[ \t]*)*if\s*\([^)]*\)\s*\{/g;
  let count = 0;
  let match = re.exec(src);
  while (match) {
    const name = match[1];
    const braceAt = match.index + match[0].length - 1;
    const closeAt = matchingClose(src, braceAt, src.length);
    if (closeAt === -1) {
      match = re.exec(src);
      continue;
    }

    const body = src.slice(braceAt + 1, closeAt);
    const assignment = body.match(
      new RegExp(`^\\s*${name.replaceAll("$", "\\$")}\\s*=[\\s\\S]*?;\\s*$`),
    );
    let k = closeAt + 1;
    while (k < src.length && isWs(src[k])) {
      k += 1;
    }

    const hasElse = src.startsWith("else", k);
    if (assignment && !hasElse) {
      count += 1;
    }

    match = re.exec(src);
  }
  return count;
};

/** `if (cond) return` / `if (cond) throw` without braces */
export const countBracelessControlFlow = (content) => {
  const re =
    /\b(?:if|else if|for|while)\s*\([^)]*\)\s+(?:return|throw|break|continue|await|[a-zA-Z_$])/g;
  return (content.match(re) ?? []).length;
};

/**
 * Sibling `if` at same indent with no blank line between closing `}` and next `if`.
 * Heuristic: `}\nif (` or `}\r\nif (` where both lines share leading whitespace depth.
 */
export const countMissingSiblingIfBlankLines = (content) => {
  const lines = content.split(/\r?\n/);
  let count = 0;
  for (let i = 0; i < lines.length - 1; i++) {
    const a = lines[i];
    const b = lines[i + 1];
    const close = a.match(/^(\s*)\}\s*$/);
    const nextIf = b.match(/^(\s*)if\s*\(/);
    if (!close || !nextIf) {
      continue;
    }

    if (close[1].length === nextIf[1].length) {
      count += 1;
    }
  }
  return count;
};

/** `type Name = {` object-shape aliases (not unions / mapped) */
export const countTypeObjectAliases = (content) => {
  return (content.match(/\btype\s+[A-Z][A-Za-z0-9_]*\s*=\s*\{/g) ?? []).length;
};

/** PascalCase arrow components: `const Foo = (` or `const Foo = (` */
export const countArrowComponents = (content) => {
  return (content.match(/\bconst\s+[A-Z][A-Za-z0-9_]*\s*=\s*(?:\(|async\s*\()/g) ?? [])
    .length;
};

export const auditFile = (content) => {
  const nestedTernaries = countNestedTernaries(content);
  const letIfReassign = countLetIfReassignments(content);
  const braceless = countBracelessControlFlow(content);
  const missingBlank = countMissingSiblingIfBlankLines(content);
  const typeObjects = countTypeObjectAliases(content);
  const arrowComponents = countArrowComponents(content);
  const lines = content.split(/\r?\n/).length;

  const reasons = [];
  if (nestedTernaries >= 1) {
    reasons.push(`${nestedTernaries} nested/chained ternary`);
  }

  if (letIfReassign >= 1) {
    reasons.push(
      `${letIfReassign} binary let+if reassignment (use a one-level ternary)`,
    );
  }

  if (braceless >= 1) {
    reasons.push(`${braceless} braceless control-flow`);
  }

  if (missingBlank >= 1) {
    reasons.push(`${missingBlank} sibling ifs missing blank line`);
  }

  if (typeObjects >= 1) {
    reasons.push(`${typeObjects} type {} object alias`);
  }

  if (arrowComponents >= 1) {
    reasons.push(`${arrowComponents} PascalCase arrow component`);
  }

  const score =
    nestedTernaries * 40 +
    letIfReassign * 25 +
    braceless * 25 +
    missingBlank * 15 +
    typeObjects * 12 +
    arrowComponents * 20 +
    (lines > 250 ? 5 : 0);

  return {
    lines,
    nestedTernaries,
    letIfReassign,
    braceless,
    missingBlank,
    typeObjects,
    arrowComponents,
    reasons,
    score,
  };
};

export const walk = async (dir, files = [], root = dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full).replaceAll("\\", "/");
    if (EXCLUDE_DIR.test(`/${rel}/`)) {
      continue;
    }

    if (entry.isDirectory()) {
      await walk(full, files, root);
    } else if (/\.(tsx|ts)$/.test(entry.name) && !EXCLUDE_FILE.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
};

export const featureFolderFor = (absRel) => {
  // absRel like apps/mobile/src/components/feed/foo.tsx
  if (absRel.includes("/components/")) {
    const after = absRel.split("/components/")[1];
    const feature = after.split("/")[0];
    return `apps/mobile/src/components/${feature}`;
  }

  if (absRel.includes("/convex/")) {
    return "packages/backend/convex";
  }

  return path.posix.dirname(absRel);
};

export const collectCandidates = async () => {
  const mobileFiles = await walk(MOBILE_SRC);
  let backendFiles = [];
  try {
    backendFiles = await walk(BACKEND_SRC);
  } catch {
    backendFiles = [];
  }

  const candidates = [];

  for (const file of [...mobileFiles, ...backendFiles]) {
    if (!/\.(tsx|ts)$/.test(file)) {
      continue;
    }

    const content = await readFile(file, "utf8");
    const audit = auditFile(content);
    if (audit.score < 30 || audit.reasons.length === 0) {
      continue;
    }

    const isMobile = file.startsWith(MOBILE_SRC);
    const root = isMobile ? MOBILE_SRC : BACKEND_SRC;
    const prefix = isMobile ? "apps/mobile/src" : "packages/backend/convex";
    const rel = path.relative(root, file).replaceAll("\\", "/");
    const absRel = `${prefix}/${rel}`;

    candidates.push({
      pick: absRel,
      folder: featureFolderFor(absRel),
      score: audit.score + (isMobile ? 1 : 0),
      ...audit,
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates;
};
