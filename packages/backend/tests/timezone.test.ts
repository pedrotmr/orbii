import { describe, expect, test } from "vitest";
import { normalizeTimezone } from "../convex/lib/timezone";

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
