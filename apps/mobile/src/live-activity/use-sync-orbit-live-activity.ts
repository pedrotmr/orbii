import { useEffect } from "react";
import type { TodayHabit } from "../today/today-habit";
import {
  endOrbitLiveActivity,
  updateExistingOrbitLiveActivity,
} from "./orbit-live-activity";
import { createOrbitLiveActivityContent } from "./orbit-live-activity-content";

const reportSyncError = (error: unknown) => {
  console.error("Failed to synchronize the Orbit Live Activity", error);
};

interface UseSyncOrbitLiveActivityArgs {
  ready: boolean;
  localDate: string;
  phase: "idle" | "reveal" | "active" | "complete" | undefined;
  committedHabits: readonly TodayHabit[];
  completedIds: readonly string[];
}

export const useSyncOrbitLiveActivity = ({
  ready,
  localDate,
  phase,
  committedHabits,
  completedIds,
}: UseSyncOrbitLiveActivityArgs) => {
  useEffect(() => {
    if (!ready || !phase) {
      return;
    }

    const content = createOrbitLiveActivityContent({
      localDate,
      phase: phase === "complete" ? "complete" : "active",
      committedHabits,
      completedIds,
    });

    if (phase === "active") {
      void updateExistingOrbitLiveActivity(content).catch(reportSyncError);
      return;
    }

    if (phase === "complete") {
      void endOrbitLiveActivity(content, "default").catch(reportSyncError);
      return;
    }

    void endOrbitLiveActivity().catch(reportSyncError);
  }, [committedHabits, completedIds, localDate, phase, ready]);
};
