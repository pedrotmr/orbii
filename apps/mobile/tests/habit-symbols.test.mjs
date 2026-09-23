import assert from "node:assert/strict";
import { test } from "node:test";
import {
  findHabitSymbol,
  searchHabitSymbols,
  suggestHabitSymbol,
  symbolGlyph,
} from "../src/components/habits/habit-symbol-catalog.ts";

test("existing starter glyphs keep their meaning in the symbol collection", () => {
  const starters = {
    "↗": "walk",
    "∿": "stretch",
    "💧": "water",
    "○": "meditate",
    "▭": "read",
    "✎": "journal",
    "◇": "workout",
    "▢": "food",
    "●": "spark",
  };
  for (const [glyph, expected] of Object.entries(starters)) {
    assert.equal(findHabitSymbol(glyph)?.id, expected);
    assert.equal(findHabitSymbol(symbolGlyph(expected))?.id, expected);
  }
});

test("custom emoji are not silently reinterpreted and unknown ids have no match", () => {
  assert.equal(findHabitSymbol("🎨"), undefined);
  assert.equal(findHabitSymbol("symbol:future-icon"), undefined);
  assert.equal(findHabitSymbol(""), undefined);
});

test("name suggestions match words, handle punctuation, and leave unfamiliar names alone", () => {
  assert.equal(suggestHabitSymbol("  Take an EVENING walk! ")?.id, "walk");
  assert.equal(suggestHabitSymbol("Read a little")?.id, "read");
  assert.equal(suggestHabitSymbol("Drink water")?.id, "water");
  assert.equal(suggestHabitSymbol("Bake bread")?.id, "bake");
  assert.equal(suggestHabitSymbol("Thread beads"), undefined);
  assert.equal(suggestHabitSymbol(""), undefined);
});

test("picker search understands synonyms and respects category filters", () => {
  assert.equal(searchHabitSymbols("hydration", "all")[0]?.id, "water");
  assert.equal(searchHabitSymbols("yoga", "body")[0]?.id, "stretch");
  assert.deepEqual(searchHabitSymbols("yoga", "learn"), []);
  assert.deepEqual(searchHabitSymbols("unavailable symbol", "all"), []);
});

test("short searches match the start of words without unrelated substring matches", () => {
  assert.deepEqual(
    searchHabitSymbols("cat", "all").map((symbol) => symbol.id),
    ["cat"],
  );
  assert.deepEqual(
    searchHabitSymbols("run", "all").map((symbol) => symbol.id),
    ["run"],
  );
  assert.equal(searchHabitSymbols("pia", "learn")[0]?.id, "piano");
  assert.equal(searchHabitSymbols("cold sho", "body")[0]?.id, "cold");
});

test("specific hobbies and everyday activities suggest their own symbols", () => {
  assert.equal(suggestHabitSymbol("Practice piano")?.id, "piano");
  assert.equal(suggestHabitSymbol("Fold laundry")?.id, "laundry");
  assert.equal(suggestHabitSymbol("Drink tea")?.id, "tea");
  assert.equal(suggestHabitSymbol("Eat vegetables")?.id, "vegetables");
  assert.equal(searchHabitSymbols("podcast", "learn")[0]?.id, "audio");
});

test("habit names find specific self-care and exercise symbols", () => {
  const habits = {
    "Take a cold shower": "cold",
    "Cold water plunge": "cold",
    "Take an ice bath": "cold",
    "Take a bath": "bath",
    "Evening skin-care routine": "skincare",
    "20 push-ups": "bodyweight",
    "Do sit-ups": "bodyweight",
    "Hold a plank": "bodyweight",
    "Practice planks": "bodyweight",
    "Do squats": "bodyweight",
    "Strength training": "workout",
    "Practice balance": "balance",
    "Table tennis practice": "table-tennis",
    "Stretch every morning": "stretch",
  };
  for (const [name, expected] of Object.entries(habits)) {
    assert.equal(suggestHabitSymbol(name)?.id, expected, name);
  }
});

test("practice and mindfulness suggestions cover different techniques and languages", () => {
  const habits = {
    "Meditating for ten minutes": "meditate",
    "Loving-kindness meditation": "meditate",
    "Body scan": "meditate",
    "Box breathing": "breathe",
    "Practice Spanish": "language",
    "Learn Japanese": "language",
    "Practice Portuguese pronunciation": "language",
    "Review flashcards": "flashcards",
    "Practice public speaking": "speaking",
    "Mindful eating": "mindful-eating",
    "Walk the dog": "dog-walk",
    "Morning sunlight": "sunrise",
  };
  for (const [name, expected] of Object.entries(habits)) {
    assert.equal(suggestHabitSymbol(name)?.id, expected, name);
  }
});

test("search accepts habit phrases and punctuation while keeping category boundaries", () => {
  assert.equal(searchHabitSymbols("push-ups", "body")[0]?.id, "bodyweight");
  assert.equal(
    searchHabitSymbols("Taking a cold shower", "all")[0]?.id,
    "cold",
  );
  assert.equal(
    searchHabitSymbols("Practice Spanish", "all")[0]?.id,
    "language",
  );
  assert.equal(searchHabitSymbols("skin-care", "body")[0]?.id, "skincare");
  assert.deepEqual(searchHabitSymbols("Practice Spanish", "body"), []);
  assert.equal(suggestHabitSymbol("Icebreaker meeting"), undefined);
});
