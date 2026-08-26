import { api } from "@orbii/backend";
import { colors, fontSize, space } from "@orbii/tokens";
import { useMutation, useQuery } from "convex/react";
import { StatusBar } from "expo-status-bar";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { TodayHabit } from "./today-habit";
import { useTodayLocal } from "../local-date";
import TodayActivePhase from "./active/today-active-phase";
import TodayCompletePhase from "./complete/today-complete-phase";
import TodayIdlePhase from "./idle/today-idle-phase";
import TodayRevealPhase from "./reveal/today-reveal-phase";
import TodayEmptyOrbit from "./states/today-empty-orbit";

export default function TodayScreen() {
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const busyRef = useRef(false);
  const user = useQuery(api.users.get, {});
  const localDate = useTodayLocal(user?.timezone);

  const startReveal = useMutation(api.day.startRevealMutation);
  const toggleSelect = useMutation(api.day.toggleSelect);
  const commit = useMutation(api.day.commit);
  const toggleComplete = useMutation(api.day.toggleComplete);
  const rereveal = useMutation(api.day.rereveal);

  const day = useQuery(api.day.get, { localDate });
  const habits = useQuery(api.habits.list, {});
  const offeredIds = day?.session.offeredIds;
  const committedIds = day?.session.committedIds;

  const offeredHabits = useMemo(() => {
    if (!offeredIds || !habits) {
      return [] as TodayHabit[];
    }

    const next: TodayHabit[] = [];

    for (const id of offeredIds) {
      const habit = habits.find((h) => h.id === id);

      if (habit) {
        next.push({ id: habit.id, name: habit.name, glyph: habit.glyph });
      }
    }

    return next;
  }, [offeredIds, habits]);

  const committedHabits = useMemo(() => {
    if (!committedIds || !habits) {
      return [] as TodayHabit[];
    }

    const next: TodayHabit[] = [];

    for (const id of committedIds) {
      const habit = habits.find((h) => h.id === id);

      if (habit) {
        next.push({ id: habit.id, name: habit.name, glyph: habit.glyph });
      }
    }

    return next;
  }, [committedIds, habits]);

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
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (day === null || user === null) {
    return (
      <View style={styles.boot}>
        <Text style={styles.error}>{error ?? "User not ready"}</Text>
      </View>
    );
  }

  const phase = day.session.phase;
  const orbitEmpty = habits.length === 0;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.brand}>Orbii</Text>

        {orbitEmpty ? <TodayEmptyOrbit /> : null}

        {!orbitEmpty && phase === "idle" ? (
          <TodayIdlePhase
            habitCount={habits.length}
            capacity={day.capacity}
            streak={day.streak}
            busy={actionBusy}
            onReveal={() => void run(() => startReveal({ localDate }))}
          />
        ) : null}

        {phase === "reveal" ? (
          <TodayRevealPhase
            capacity={day.capacity}
            selectedIds={day.session.selectedIds}
            offeredHabits={offeredHabits}
            busy={actionBusy}
            onToggle={(habitId) =>
              void run(() => toggleSelect({ localDate, habitId }))
            }
            onCommit={() => void run(() => commit({ localDate }))}
            onShuffle={() => void run(() => rereveal({ localDate }))}
          />
        ) : null}

        {phase === "active" ? (
          <TodayActivePhase
            committedHabits={committedHabits}
            completedIds={day.session.completedIds}
            busy={actionBusy}
            onToggle={(habitId) =>
              void run(() => toggleComplete({ localDate, habitId }))
            }
            onReshuffle={() => void run(() => rereveal({ localDate }))}
          />
        ) : null}

        {phase === "complete" ? (
          <TodayCompletePhase
            streak={day.streak}
            daysCompleted={day.daysCompleted}
            committedHabits={committedHabits}
          />
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    gap: space[3],
    padding: space[6],
  },
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    padding: space[6],
    paddingBottom: space[12],
    gap: space[4],
  },
  brand: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  error: {
    color: colors.primaryDeep,
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
