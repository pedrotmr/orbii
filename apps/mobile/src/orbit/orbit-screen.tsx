import { api } from "@orbii/backend";
import { useMutation, useQuery } from "convex/react";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, AppState, Platform } from "react-native";
import BootSpinner from "../components/boot-spinner";
import ScreenScaffold from "../components/layout/screen-scaffold";
import InlineError from "../components/states/inline-error";
import {
  hasActiveOrbitLiveActivity,
  isOrbitLiveActivitySupported,
  startOrbitLiveActivity,
} from "../live-activity/orbit-live-activity";
import { createOrbitLiveActivityContent } from "../live-activity/orbit-live-activity-content";
import { useSyncOrbitLiveActivity } from "../live-activity/use-sync-orbit-live-activity";
import { todayLocalInTimezone, useTodayLocal } from "../local-date";
import { resolveTodayHabits } from "../today/today-habit";
import OrbitContent from "./body/orbit-content";

export default function OrbitScreen() {
  const user = useQuery(api.users.get, {});
  const localDate = useTodayLocal(user?.timezone);
  const timezone = user?.timezone?.trim();
  const isLocalDateReady =
    user !== undefined &&
    user !== null &&
    (!timezone || localDate === todayLocalInTimezone(timezone));
  const day = useQuery(api.day.get, { localDate });
  const habits = useQuery(api.habits.list, {});
  const removeHabit = useMutation(api.habits.remove);
  const reorderHabits = useMutation(api.habits.reorder).withOptimisticUpdate(
    (localStore, args) => {
      const currentHabits = localStore.getQuery(api.habits.list, {});

      if (!currentHabits) {
        return;
      }

      const habitsByKey = new Map(
        currentHabits.map((habit) => [habit.id, habit]),
      );
      const reorderedHabits = args.habitKeys.flatMap((habitKey) => {
        const habit = habitsByKey.get(habitKey);
        return habit ? [habit] : [];
      });

      if (reorderedHabits.length === currentHabits.length) {
        localStore.setQuery(api.habits.list, {}, reorderedHabits);
      }
    },
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveActivityAvailability, setLiveActivityAvailability] = useState<
    "checking" | "available" | "active" | "unavailable"
  >("checking");

  const committedHabits = useMemo(() => {
    return resolveTodayHabits(day?.session.committedIds, habits);
  }, [day?.session.committedIds, habits]);

  useSyncOrbitLiveActivity({
    ready:
      isLocalDateReady &&
      day !== undefined &&
      day !== null &&
      habits !== undefined,
    localDate,
    phase: day?.session.phase,
    committedHabits,
    completedIds: day?.session.completedIds ?? [],
  });

  useFocusEffect(
    useCallback(() => {
      let isFocused = true;

      const refreshLiveActivityAvailability = async () => {
        try {
          const [isSupported, hasActiveActivity] = await Promise.all([
            isOrbitLiveActivitySupported(),
            hasActiveOrbitLiveActivity(),
          ]);

          if (isFocused) {
            setLiveActivityAvailability(
              !isSupported
                ? "unavailable"
                : hasActiveActivity
                  ? "active"
                  : "available",
            );
          }
        } catch {
          if (isFocused) {
            setLiveActivityAvailability("unavailable");
          }
        }
      };

      void refreshLiveActivityAvailability();

      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") {
          void refreshLiveActivityAvailability();
        }
      });

      return () => {
        isFocused = false;
        subscription.remove();
      };
    }, []),
  );

  const run = async (fn: () => Promise<unknown>) => {
    if (busy) {
      return false;
    }

    try {
      setBusy(true);
      setError(null);
      await fn();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (habits === undefined || user === undefined || day === undefined) {
    return <BootSpinner />;
  }

  if (user === null || day === null) {
    return (
      <ScreenScaffold tabbed>
        <InlineError message="We couldn’t load your Orbit. Please try opening the app again." />
      </ScreenScaffold>
    );
  }

  const hasCommittedOrbit = day.session.phase === "active";

  const handleRemove = (habitKey: string) => {
    Alert.alert(
      "Remove habit",
      "This habit will leave your Orbit and today’s focus.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            void run(async () => {
              await removeHabit({ habitKey, localDate });
            });
          },
        },
      ],
    );
  };

  const handleReorder = (habitKeys: string[]) => {
    void run(() => reorderHabits({ habitKeys }));
  };

  const handleRestoreLiveActivity = () => {
    void run(async () => {
      if (day.session.phase !== "active") {
        throw new Error(
          "Commit today’s Orbit before showing it on the Lock Screen.",
        );
      }

      const started = await startOrbitLiveActivity(
        createOrbitLiveActivityContent({
          localDate,
          phase: "active",
          committedHabits,
          completedIds: day.session.completedIds,
        }),
      );

      if (!started) {
        throw new Error("Live Activities aren’t available on this device.");
      }

      setLiveActivityAvailability("active");
    });
  };

  return (
    <OrbitContent
      habits={habits}
      busy={busy}
      error={error}
      showLiveActivityButton={
        liveActivityAvailability === "available" && hasCommittedOrbit
      }
      showLiveActivityUnsupported={
        Platform.OS === "ios" &&
        liveActivityAvailability === "unavailable" &&
        hasCommittedOrbit
      }
      onRestoreLiveActivity={handleRestoreLiveActivity}
      onRemove={handleRemove}
      onReorder={handleReorder}
    />
  );
}
