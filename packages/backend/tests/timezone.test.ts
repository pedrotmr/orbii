import { describe, expect, test } from "vitest";
import { localDateInTimezone, normalizeTimezone } from "../convex/lib/timezone";

describe("normalizeTimezone", () => {
  test("trims whitespace", () => {
    expect(normalizeTimezone("  America/Sao_Paulo  ")).toBe(
      "America/Sao_Paulo",
    );
  });

  test("rejects empty", () => {
    expect(() => normalizeTimezone("   ")).toThrow("Timezone is required");
  });

  test("rejects overly long values", () => {
    expect(() => normalizeTimezone("x".repeat(65))).toThrow(
      "Timezone is too long",
    );
  });

  test("rejects invalid timezone names", () => {
    expect(() => normalizeTimezone("America/Invalid")).toThrow(
      "Invalid timezone",
    );
  });
});

test("localDateInTimezone derives a stable calendar day from the saved timezone", () => {
  expect(
    localDateInTimezone("America/Los_Angeles", Date.UTC(2026, 0, 1, 2)),
  ).toBe("2025-12-31");
  expect(localDateInTimezone("Asia/Tokyo", Date.UTC(2025, 11, 31, 15))).toBe(
    "2026-01-01",
  );
});
