export interface TodayHabit {
  id: string;
  name: string;
  glyph: string;
}

export const resolveTodayHabits = (
  ids: readonly string[] | undefined,
  habits: readonly TodayHabit[] | undefined,
) => {
  if (!ids || !habits) {
    return [] as TodayHabit[];
  }

  const next: TodayHabit[] = [];

  for (const id of ids) {
    const habit = habits.find((item) => item.id === id);

    if (habit) {
      next.push({ id: habit.id, name: habit.name, glyph: habit.glyph });
    }
  }

  return next;
};
