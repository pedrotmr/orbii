import { darkColors, space } from "@orbii/tokens";
import type { TodayHabit } from "../today/today-habit";

export interface OrbitLiveActivityHabit {
  id: string;
  name: string;
  isComplete: boolean;
}

export interface OrbitLiveActivityContent {
  localDate: string;
  phase: "active" | "complete";
  completedCount: number;
  totalCount: number;
  accentColor: string;
  spacing: OrbitLiveActivitySpacing;
  habits: OrbitLiveActivityHabit[];
}

export interface OrbitLiveActivitySpacing {
  horizontalInset: number;
  verticalInset: number;
  sectionGap: number;
  rowGap: number;
  iconGap: number;
  listLeadingInset: number;
  compactGap: number;
  microGap: number;
  progressRingSize: number;
  logoSize: number;
}

interface CreateOrbitLiveActivityContentArgs {
  localDate: string;
  phase: OrbitLiveActivityContent["phase"];
  committedHabits: readonly TodayHabit[];
  completedIds: readonly string[];
}

export const createOrbitLiveActivityContent = ({
  localDate,
  phase,
  committedHabits,
  completedIds,
}: CreateOrbitLiveActivityContentArgs) => {
  const completed = new Set(completedIds);
  const habits = committedHabits.map((habit) => ({
    id: habit.id,
    name: habit.name,
    isComplete: completed.has(habit.id),
  }));

  return {
    localDate,
    phase,
    completedCount: habits.filter((habit) => habit.isComplete).length,
    totalCount: habits.length,
    accentColor: darkColors.primary,
    spacing: {
      horizontalInset: space[5],
      verticalInset: space[4],
      sectionGap: space[3],
      rowGap: space[2],
      iconGap: space[2],
      listLeadingInset: space[1],
      compactGap: space[2],
      microGap: space[1],
      progressRingSize: space[6],
      logoSize: space[2],
    },
    habits,
  };
};
