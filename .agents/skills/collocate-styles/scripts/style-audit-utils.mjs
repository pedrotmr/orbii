import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const MOBILE_SRC = path.resolve(__dirname, "../../../../apps/mobile/src");

export const EXCLUDE_DIR = /(?:^|\/)(vendor|_generated)(?:\/|$)/;
export const EXCLUDE_FILE = /\.(test|spec)\.[tj]sx?$/;
export const STYLE_FILE_RE = /-styles(?:-shared)?\.ts$/;
export const STYLE_KEY_RE = /^\s+(\w+):\s*\{/gm;
export const STYLE_BIND_RE = /StyleSheet\.create\(/;
const IMPORT_FROM_RE =
  /import\s+(?:type\s+)?(?:\{([^}]+)\}|(\w+))\s+from\s+["']([^"']+)["']/g;

export async function walk(dir, files = []) {
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

export function featureRootFor(styleRel) {
  const parts = styleRel.replace(/^components\//, "").split("/");
  return `components/${parts[0]}`;
}

export function parseStyleKeys(content) {
  if (!STYLE_BIND_RE.test(content)) return [];
  return [...content.matchAll(STYLE_KEY_RE)].map((match) => match[1]);
}

export function resolveImportPath(fromFile, importPath) {
  const fromDir = path.dirname(fromFile);
  let resolved = importPath;
  if (importPath.startsWith(".")) {
    resolved = path.join(fromDir, importPath);
  } else if (importPath.startsWith("@/")) {
    resolved = path.join(MOBILE_SRC, importPath.slice(2));
  }
  if (!resolved.endsWith(".ts") && !resolved.endsWith(".tsx")) {
    resolved += ".ts";
  }
  return path.normalize(resolved);
}

function parseImportBindings(clause) {
  const bindings = [];
  for (const segment of clause.split(",")) {
    const trimmed = segment.trim();
    if (!trimmed) continue;
    const aliasMatch = trimmed.match(/^(?:type\s+)?(\w+)\s+as\s+(\w+)$/);
    if (aliasMatch) {
      bindings.push(aliasMatch[2]);
      continue;
    }
    bindings.push(trimmed.replace(/^type\s+/, ""));
  }
  return bindings;
}

export function styleImportsFrom(content) {
  const imports = [];
  for (const match of content.matchAll(IMPORT_FROM_RE)) {
    const importPath = match[3];
    if (!importPath.includes("styles")) continue;
    const bindings = match[1]
      ? parseImportBindings(match[1])
      : match[2]
        ? [match[2]]
        : [];
    imports.push({ bindings, importPath });
  }
  return imports;
}

export function styleBindingForFile(content, styleAbsPath, consumerFile) {
  const bindings = new Set(["styles"]);
  for (const imp of styleImportsFrom(content)) {
    const resolved = resolveImportPath(consumerFile, imp.importPath);
    const alt = resolved.replace(/\.tsx$/, ".ts");
    if (
      path.normalize(styleAbsPath) === path.normalize(alt) ||
      path.normalize(styleAbsPath) === path.normalize(resolved)
    ) {
      for (const binding of imp.bindings) {
        bindings.add(binding);
      }
    }
  }
  return bindings;
}

export function findUsages(content, keys, bindings) {
  const used = new Set();
  const bindingPattern = [...bindings].join("|");
  if (!bindingPattern) return used;
  const usageRe = new RegExp(`(?:${bindingPattern})\\s*\\.\\s*(\\w+)`, "g");
  for (const match of content.matchAll(usageRe)) {
    if (keys.includes(match[1])) used.add(match[1]);
  }
  return used;
}

export function importsStyleFile(content, styleFile, consumerFile) {
  return styleImportsFrom(content).some((imp) => {
    const resolved = resolveImportPath(consumerFile, imp.importPath);
    const alt = resolved.replace(/\.tsx$/, ".ts");
    return (
      path.normalize(styleFile) === path.normalize(alt) ||
      path.normalize(styleFile) === path.normalize(resolved)
    );
  });
}

export async function auditStyleFile(styleFile, allFiles) {
  const content = await readFile(styleFile, "utf8");
  const lines = content.split("\n").length;
  const keys = parseStyleKeys(content);
  if (keys.length === 0) return null;

  const styleRel = path.relative(MOBILE_SRC, styleFile).replaceAll("\\", "/");
  const featureRoot = featureRootFor(styleRel);

  const consumers = allFiles.filter((file) => {
    const rel = path.relative(MOBILE_SRC, file).replaceAll("\\", "/");
    return rel.startsWith(featureRoot) && /\.tsx$/.test(file) && file !== styleFile;
  });

  const keyConsumers = new Map(keys.map((key) => [key, new Set()]));

  for (const consumer of consumers) {
    const consumerContent = await readFile(consumer, "utf8");
    if (!importsStyleFile(consumerContent, styleFile, consumer)) continue;

    const bindings = styleBindingForFile(consumerContent, styleFile, consumer);
    const used = findUsages(consumerContent, keys, bindings);
    const consumerRel = path.relative(MOBILE_SRC, consumer).replaceAll("\\", "/");
    for (const key of used) {
      keyConsumers.get(key)?.add(consumerRel);
    }
  }

  let privateCount = 0;
  let sharedCount = 0;
  const privateByFile = new Map();
  const privateKeys = [];
  const sharedKeys = [];
  const orphanKeys = [];

  for (const [key, users] of keyConsumers) {
    if (users.size === 0) {
      orphanKeys.push(key);
    } else if (users.size === 1) {
      privateCount++;
      const file = [...users][0];
      privateByFile.set(file, (privateByFile.get(file) ?? 0) + 1);
      privateKeys.push({ key, file });
    } else {
      sharedCount++;
      sharedKeys.push({ key, files: [...users] });
    }
  }

  const privateRatio = keys.length > 0 ? privateCount / keys.length : 0;

  return {
    styleFile,
    styleRel,
    featureRoot,
    lines,
    keys,
    keyConsumers,
    privateCount,
    sharedCount,
    privateRatio,
    privateByFile,
    privateKeys,
    sharedKeys,
    orphanKeys,
    consumers: new Set([...keyConsumers.values()].flatMap((set) => [...set])).size,
  };
}
