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

interface CommittedHabitSnapshot {
  habitId: string;
  name: string;
  glyph: string;
}

export const resolveTodayHabits = (
  ids: readonly string[] | undefined,
  habits: readonly TodayHabit[] | undefined,
  committedPointValues?: readonly CommittedPointValue[],
  committedHabitSnapshots?: readonly CommittedHabitSnapshot[],
) => {
  if (!ids || !habits) {
    return [] as TodayHabit[];
  }

  const next: TodayHabit[] = [];
  const pointsByHabitId = new Map(
    committedPointValues?.map(({ habitId, points }) => [habitId, points]),
  );
  const snapshotsByHabitId = new Map(
    committedHabitSnapshots?.map((snapshot) => [snapshot.habitId, snapshot]),
  );

  for (const id of ids) {
    const habit = habits.find((item) => item.id === id);
    const snapshot = snapshotsByHabitId.get(id);
    const name = habit?.name ?? snapshot?.name;
    const glyph = habit?.glyph ?? snapshot?.glyph;
    const pointValue = pointsByHabitId.get(id) ?? habit?.pointValue;

    if (name && glyph && pointValue !== undefined) {
      next.push({
        id,
        name,
        glyph,
        pointValue,
      });
    }
  }

  return next;
};
