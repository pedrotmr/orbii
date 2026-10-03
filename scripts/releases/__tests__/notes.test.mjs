import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveNotes } from "../source.mjs";

const sha = "a".repeat(40);

test("custom notes remain exact data without reading Git", () => {
  const notes = "Tested login; $(touch nope)\nDevice details";
  assert.equal(
    resolveNotes(notes, sha, () => {
      throw new Error("Unexpected Git call");
    }),
    notes,
  );
});

test("empty notes use the selected commit's subject and SHA", () => {
  for (const notes of [undefined, "", "  "]) {
    assert.equal(
      resolveNotes(notes, sha, (args) => {
        assert.deepEqual(args, ["show", "-s", "--format=%s", sha]);
        return "Improve game sharing\n";
      }),
      "Automatic: Improve game sharing (aaaaaaa)",
    );
  }
});

test("automatic notes cannot use a moving ref or claim an unselected commit", () => {
  assert.throws(
    () => resolveNotes(undefined, "main"),
    /full 40-character commit/,
  );
});
