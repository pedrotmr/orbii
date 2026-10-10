export type HabitCategory = "body" | "mind" | "learn" | "life";

export interface Habit {
  id: string;
  name: string;
  glyph: string;
  category: HabitCategory;
  pointValue?: number;
}

interface HabitOrderRecord {
  _creationTime: number;
  order?: number;
}

export const sortHabitsByOrder = <T extends HabitOrderRecord>(
  habits: readonly T[],
) => {
  const allHaveOrder = habits.every((habit) => habit.order !== undefined);

  return [...habits].sort((left, right) => {
    if (!allHaveOrder) {
      return left._creationTime - right._creationTime;
    }

    return (left.order ?? 0) - (right.order ?? 0);
  });
};

export const nextHabitOrder = (habits: readonly HabitOrderRecord[]) => {
  if (!habits.every((habit) => habit.order !== undefined)) {
    return habits.length;
  }

  return (
    habits.reduce(
      (maxOrder, habit) => Math.max(maxOrder, habit.order ?? -1),
      -1,
    ) + 1
  );
};

export const OFFER_SIZE = 5;
export const DEFAULT_CAPACITY = 2;
export const MIN_CAPACITY = 1;
export const MAX_CAPACITY = 5;

/** Easy starter seeds suggested first in setup. */
export const EASY_STARTER_IDS = [
  "walk",
  "stretch",
  "water",
  "meditate",
] as const;

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

export const starterHabitPointValue = (habitId: string) => {
  return EASY_STARTER_IDS.some((easyId) => easyId === habitId) ? 10 : 20;
};

export const clampDefaultCapacity = (n: number) => {
  const value = Number.isFinite(n) ? Math.floor(n) : DEFAULT_CAPACITY;
  return Math.max(MIN_CAPACITY, Math.min(MAX_CAPACITY, value));
};

export const offerSizeFor = (orbitSize: number) => {
  return Math.min(OFFER_SIZE, Math.max(0, orbitSize));
};
