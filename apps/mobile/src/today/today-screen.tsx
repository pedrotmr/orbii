import { api } from "@orbii/backend";
import { useMutation } from "convex/react";
import { useMemo, useRef, useState } from "react";
import BootSpinner from "../components/boot-spinner";
import { completionFeedback } from "../components/controls/feedback";
import ScreenScaffold from "../components/layout/screen-scaffold";
import InlineError from "../components/states/inline-error";
import {
  isOrbitLiveActivitySupported,
  startOrbitLiveActivity,
} from "../live-activity/orbit-live-activity";
import { createOrbitLiveActivityContent } from "../live-activity/orbit-live-activity-content";
import { useSyncOrbitLiveActivity } from "../live-activity/use-sync-orbit-live-activity";
import { resolveTodayHabits } from "../orbit-day/today-habit";
import { useOrbitDay } from "../orbit-day/use-orbit-day";
import TodayActivePhase from "./active/today-active-phase";
import TodayHeader from "./chrome/today-header";
import TodayCompletePhase from "./complete/today-complete-phase";
import TodayIdlePhase from "./idle/today-idle-phase";
import TodayRevealPhase from "./reveal/today-reveal-phase";
import TodayEmptyOrbit from "./states/today-empty-orbit";

export default function TodayScreen() {
  const [error, setError] = useState<string | null>(null);
  const [releasedOrbit, setReleasedOrbit] = useState<{
    localDate: string;
    count: number;
  } | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const busyRef = useRef(false);
  const { user, localDate, day, habits, committedHabits, ready } =
    useOrbitDay();
  useSyncOrbitLiveActivity({
    ready,
    localDate,
    phase: day?.session.phase,
    committedHabits,
    completedIds: day?.session.completedIds ?? [],
  });

  const startReveal = useMutation(api.day.startRevealMutation);
  const toggleSelect = useMutation(api.day.toggleSelect);
  const commit = useMutation(api.day.commit);
  const toggleComplete = useMutation(api.day.toggleComplete);
  const rereveal = useMutation(api.day.rereveal);

  const offeredIds = day?.session.offeredIds;

  const offeredHabits = useMemo(() => {
    return resolveTodayHabits(offeredIds, habits);
  }, [offeredIds, habits]);

  const selectedHabits = useMemo(() => {
    return resolveTodayHabits(day?.session.selectedIds, habits);
  }, [day?.session.selectedIds, habits]);

  const run = async (fn: () => Promise<unknown>) => {
    if (busyRef.current) {
      return;
    }

    busyRef.current = true;

    try {
      setActionBusy(true);
      setError(null);
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      busyRef.current = false;
      setActionBusy(false);
    }
  };

  if (day === undefined || habits === undefined || user === undefined) {
    return <BootSpinner />;
  }

  if (day === null || user === null) {
    return (
      <ScreenScaffold tabbed>
        <InlineError message="We couldn’t load your Orbit. Please try opening the app again." />
      </ScreenScaffold>
    );
  }

  const phase = day.session.phase;
  const orbitEmpty = habits.length === 0;

  return (
    <ScreenScaffold tabbed>
      <TodayHeader localDate={localDate} />
      {orbitEmpty && phase === "idle" ? <TodayEmptyOrbit /> : null}

      {!orbitEmpty && phase === "idle" ? (
        <TodayIdlePhase
          habitCount={habits.length}
          capacity={day.capacity}
          streak={day.streak}
          busy={actionBusy}
          onReveal={() =>
            void run(async () => {
              await startReveal({ localDate });
              setReleasedOrbit(null);
            })
          }
        />
      ) : null}

      {phase === "reveal" ? (
        <TodayRevealPhase
          usualCount={day.capacity}
          selectedIds={day.session.selectedIds}
          offeredHabits={offeredHabits}
          releasedCount={
            releasedOrbit?.localDate === localDate ? releasedOrbit.count : null
          }
          busy={actionBusy}
          onToggle={(habitId) =>
            void run(() => toggleSelect({ localDate, habitId }))
          }
          onCommit={() =>
            void run(async () => {
              await commit({ localDate });

              try {
                if (!(await isOrbitLiveActivitySupported())) {
                  return;
                }

                const started = await startOrbitLiveActivity(
                  createOrbitLiveActivityContent({
                    localDate,
                    phase: "active",
                    committedHabits: selectedHabits,
                    completedIds: [],
                  }),
                );

                if (!started) {
                  setError(
                    "Your Orbit is committed, but we couldn’t show it on the Lock Screen. Try again from Orbit.",
                  );
                }
              } catch {
                setError(
                  "Your Orbit is committed, but we couldn’t show it on the Lock Screen. Try again from Orbit.",
                );
              }
            })
          }
          onShuffle={() =>
            void run(async () => {
              await rereveal({ localDate });
            })
          }
        />
      ) : null}

      {phase === "active" ? (
        <TodayActivePhase
          committedHabits={committedHabits}
          completedIds={day.session.completedIds}
          busy={actionBusy}
          canReshuffle={habits.length > 0}
          onToggle={(habitId) =>
            void run(async () => {
              const wasCompleted = day.session.completedIds.includes(habitId);
              const completesOrbitWithoutResult =
                !wasCompleted &&
                day.session.completedIds.length + 1 ===
                  day.session.committedIds.length;
              const result = await toggleComplete({ localDate, habitId });

              if (result?.completedOrbit ?? completesOrbitWithoutResult) {
                completionFeedback();
              }
            })
          }
          onReshuffle={() =>
            void run(async () => {
              await rereveal({ localDate });
              setReleasedOrbit({
                localDate,
                count: day.session.committedIds.length,
              });
            })
          }
        />
      ) : null}

      {phase === "complete" ? (
        <TodayCompletePhase
          streak={day.streak}
          daysCompleted={day.daysCompleted}
          earnedPoints={day.earnedPoints}
          committedHabits={committedHabits}
          busy={actionBusy}
          onToggle={(habitId) =>
            void run(async () => {
              await toggleComplete({ localDate, habitId });

              try {
                if (!(await isOrbitLiveActivitySupported())) {
                  return;
                }

                const started = await startOrbitLiveActivity(
                  createOrbitLiveActivityContent({
                    localDate,
                    phase: "active",
                    committedHabits,
                    completedIds: day.session.completedIds.filter(
                      (completedId) => completedId !== habitId,
                    ),
                  }),
                );

                if (!started) {
                  setError(
                    "Your Orbit is reopened, but we couldn’t show it on the Lock Screen. Try again from Orbit.",
                  );
                }
              } catch {
                setError(
                  "Your Orbit is reopened, but we couldn’t show it on the Lock Screen. Try again from Orbit.",
                );
              }
            })
          }
        />
      ) : null}

      {error ? <InlineError message={error} /> : null}
    </ScreenScaffold>
  );
}
