export interface TodayHabit {
  id: string;
  name: string;
  glyph: string;
  pointValue: number;
}

interface CommittedPointValue {
  habitId: string;
  points: number;
}

export const resolveTodayHabits = (
  ids: readonly string[] | undefined,
  habits: readonly TodayHabit[] | undefined,
  committedPointValues?: readonly CommittedPointValue[],
) => {
  if (!ids || !habits) {
    return [] as TodayHabit[];
  }

  const next: TodayHabit[] = [];
  const pointsByHabitId = new Map(
    committedPointValues?.map(({ habitId, points }) => [habitId, points]),
  );

  for (const id of ids) {
    const habit = habits.find((item) => item.id === id);

    if (habit) {
      next.push({
        id: habit.id,
        name: habit.name,
        glyph: habit.glyph,
        pointValue: pointsByHabitId.get(habit.id) ?? habit.pointValue,
      });
    }
  }

  return next;
};
