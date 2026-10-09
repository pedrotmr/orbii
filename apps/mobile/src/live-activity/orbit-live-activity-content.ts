import { brandColors, darkColors, space } from "@orbii/tokens";
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
  reducedLuminanceColor: string;
  logoColor: string;
  logoDotColor: string;
  spacing: OrbitLiveActivitySpacing;
  habits: OrbitLiveActivityHabit[];
}

interface OrbitLiveActivityBannerSpacing {
  horizontalInset: number;
  verticalInset: number;
  sectionGap: number;
  listLeadingInset: number;
  progressRingSize: number;
  logoSize: number;
}

interface OrbitLiveActivityHabitRowsSpacing {
  rowGap: number;
  iconGap: number;
}

interface OrbitLiveActivityCompactSpacing {
  compactGap: number;
}

interface OrbitLiveActivityIslandSpacing {
  microGap: number;
}

export interface OrbitLiveActivitySpacing
  extends
    OrbitLiveActivityBannerSpacing,
    OrbitLiveActivityHabitRowsSpacing,
    OrbitLiveActivityCompactSpacing,
    OrbitLiveActivityIslandSpacing {}

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
    reducedLuminanceColor: brandColors.white,
    logoColor: brandColors.teal,
    logoDotColor: brandColors.coral,
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
      logoSize: space[4],
    },
    habits,
  };
};
