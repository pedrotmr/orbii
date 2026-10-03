import assert from "node:assert/strict";
import { test } from "node:test";
import { parseEasJson } from "../eas-json.mjs";

test("EAS build arrays remain valid machine output", () => {
  assert.deepEqual(parseEasJson('[{"id":"build-id"}]\n'), [{ id: "build-id" }]);
});

test("fingerprint JSON can follow EAS environment-loading notices", () => {
  const result = {
    fingerprint1: { hash: "installed-native" },
    fingerprint2: { hash: "selected-native" },
  };
  const output = `Environment variables loaded from the preview environment.\nNotice {not JSON}\n${JSON.stringify(result, null, 2)}\n`;
  assert.deepEqual(parseEasJson(output), result);
});

test("malformed or missing machine output still fails closed", () => {
  assert.throws(() => parseEasJson("Environment variables loaded.\n"));
  assert.throws(() => parseEasJson('Notice\n{"fingerprint1":\n'));
  assert.throws(() => parseEasJson("{}\nUnexpected trailing output\n"));
});
