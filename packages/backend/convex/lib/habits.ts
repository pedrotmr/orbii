export type HabitCategory = "body" | "mind" | "learn" | "life";

export type Habit = {
  id: string;
  name: string;
  glyph: string;
  category: HabitCategory;
};

export const OFFER_SIZE = 5;
export const DEFAULT_CAPACITY = 2;
export const MIN_CAPACITY = 1;
export const MAX_CAPACITY = 5;

export const STARTER_HABITS: Habit[] = [
  { id: "walk", name: "Walk", glyph: "↗", category: "body" },
  { id: "stretch", name: "Stretch", glyph: "∿", category: "body" },
  { id: "water", name: "Drink water", glyph: "💧", category: "life" },
  { id: "meditate", name: "Meditate", glyph: "○", category: "mind" },
  { id: "read", name: "Read", glyph: "▭", category: "learn" },
  { id: "journal", name: "Journal", glyph: "✎", category: "mind" },
  { id: "workout", name: "Workout", glyph: "◇", category: "body" },
  { id: "food", name: "Track food", glyph: "▢", category: "life" },
];

/** Easy seeds suggested first in setup. */
export const EASY_STARTER_IDS = [
  "walk",
  "stretch",
  "water",
  "meditate",
] as const;

export const clampCapacity = (n: number, orbitSize: number) => {
  const capped = Math.max(MIN_CAPACITY, Math.min(MAX_CAPACITY, Math.floor(n)));
  if (orbitSize <= 0) {
    return MIN_CAPACITY;
  }
  return Math.min(capped, orbitSize);
};

export const offerSizeFor = (orbitSize: number) => {
  return Math.min(OFFER_SIZE, Math.max(0, orbitSize));
};
