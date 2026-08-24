export type HabitId = string;

export type Habit = {
  id: HabitId;
  name: string;
  glyph: string;
  category: "body" | "mind" | "learn" | "life";
};

export const STARTER_HABITS: Habit[] = [
  { id: "workout", name: "Workout", glyph: "◇", category: "body" },
  { id: "meditate", name: "Meditate", glyph: "○", category: "mind" },
  { id: "read", name: "Read", glyph: "▭", category: "learn" },
  { id: "stretch", name: "Stretch", glyph: "∿", category: "body" },
  { id: "food", name: "Track food", glyph: "▢", category: "life" },
  { id: "japanese", name: "Study Japanese", glyph: "あ", category: "learn" },
  { id: "journal", name: "Journal", glyph: "✎", category: "mind" },
  { id: "walk", name: "Walk", glyph: "↗", category: "body" },
];

export const OFFER_SIZE = 5;
export const CAPACITY = 2;
