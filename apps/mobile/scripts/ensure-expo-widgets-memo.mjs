import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

const normalizeMemoExport = (source) => {
  const memoExport = "export const memo = <T>(component: T): T => component;";
  const lines = source.split(/\r?\n/);
  const withoutMemoExports = lines.filter((line) => line.trim() !== memoExport);
  const useContextIndex = withoutMemoExports.findIndex((line) =>
    line.startsWith("export const useContext ="),
  );

  if (useContextIndex === -1) {
    throw new Error("Could not find expo-widgets useContext export.");
  }

  const linesBeforeContext = withoutMemoExports.slice(0, useContextIndex);

  while (linesBeforeContext.at(-1)?.trim() === "") {
    linesBeforeContext.pop();
  }

  return [
    ...linesBeforeContext,
    "",
    memoExport,
    ...withoutMemoExports.slice(useContextIndex),
  ].join("\n");
};

const require = createRequire(import.meta.url);
const widgetsRoot = resolve(dirname(require.resolve("expo-widgets")), "..");
const widgetsPackagePath = resolve(widgetsRoot, "package.json");
const stubPath = resolve(widgetsRoot, "bundle/react-stub.ts");
const widgetsPackage = JSON.parse(await readFile(widgetsPackagePath, "utf8"));

if (widgetsPackage.version !== "58.0.7") {
  throw new Error(
    `Expected expo-widgets@58.0.7, received ${widgetsPackage.version}`,
  );
}

const stub = await readFile(stubPath, "utf8");
const normalizedStub = normalizeMemoExport(stub);

if (normalizedStub !== stub) {
  await writeFile(stubPath, normalizedStub);
}

console.log("Ensured expo-widgets has one memo export.");
