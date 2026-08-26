import { useAuth } from "@clerk/expo";
import { api, OFFER_SIZE } from "@orbii/backend";
import { colors, fontSize, radius, space } from "@orbii/tokens";
import { useMutation, useQuery } from "convex/react";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GhostButton from "../components/ghost-button";
import Metric from "../components/metric";
import PrimaryButton from "../components/primary-button";
import { useTodayLocal } from "../local-date";

export default function RitualScreen() {
  const { signOut } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const localDate = useTodayLocal();

  const startReveal = useMutation(api.day.startRevealMutation);
  const toggleSelect = useMutation(api.day.toggleSelect);
  const commit = useMutation(api.day.commit);
  const toggleComplete = useMutation(api.day.toggleComplete);
  const rereveal = useMutation(api.day.rereveal);

  const day = useQuery(api.day.get, { localDate });
  const habits = useQuery(api.habits.list, {});

  const offeredHabits = useMemo(() => {
    if (!day || !habits) {
      return [];
    }

    return day.session.offeredIds
      .map((id) => habits.find((h) => h.id === id))
      .filter(Boolean);
  }, [day, habits]);

  const committedHabits = useMemo(() => {
    if (!day || !habits) {
      return [];
    }

    return day.session.committedIds
      .map((id) => habits.find((h) => h.id === id))
      .filter(Boolean);
  }, [day, habits]);

  const run = async (fn: () => Promise<unknown>) => {
    if (actionBusy) {
      return;
    }

    try {
      setActionBusy(true);
      setError(null);
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setActionBusy(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setError(null);
      await signOut();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign out failed");
    }
  };

  if (day === undefined || habits === undefined) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (day === null) {
    return (
      <View style={styles.boot}>
        <Text style={styles.error}>{error ?? "User not ready"}</Text>
        <GhostButton label="Sign out" onPress={() => void handleSignOut()} />
      </View>
    );
  }

  const phase = day.session.phase;
  const orbitEmpty = habits.length === 0;
  const canReveal = !orbitEmpty && !actionBusy;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.brand}>Orbii</Text>

        {orbitEmpty ? (
          <View style={styles.block}>
            <Text style={styles.title}>Your Orbit is empty</Text>
            <Text style={styles.sub}>
              Reveal stays closed until you add at least one habit.
            </Text>
          </View>
        ) : null}

        {!orbitEmpty && phase === "idle" ? (
          <View style={styles.block}>
            <Text style={styles.title}>Ready for today’s Orbit?</Text>
            <Text style={styles.sub}>
              We’ll offer {Math.min(OFFER_SIZE, habits.length)} options. Pick up
              to {day.capacity} you can actually do.
            </Text>
            <View style={styles.metrics}>
              <Metric label="In Orbit" value={String(habits.length)} />
              <Metric label="Day streak" value={String(day.streak)} />
              <Metric label="Capacity" value={String(day.capacity)} />
            </View>
            <PrimaryButton
              label="See today’s options"
              disabled={!canReveal}
              onPress={() => void run(() => startReveal({ localDate }))}
            />
          </View>
        ) : null}

        {phase === "reveal" ? (
          <View style={styles.block}>
            <Text style={styles.eyebrow}>Today’s offer</Text>
            <Text style={styles.title}>What can you take on?</Text>
            <Text style={styles.sub}>
              Pick up to {day.capacity}. Low energy — just don’t choose what
              won’t work today.
            </Text>
            <Text style={styles.chip}>
              {day.session.selectedIds.length}/{day.capacity}
            </Text>
            <View style={styles.list}>
              {offeredHabits.map((habit) => {
                if (!habit) {
                  return null;
                }

                const selected = day.session.selectedIds.includes(habit.id);
                return (
                  <Pressable
                    key={habit.id}
                    disabled={actionBusy}
                    onPress={() =>
                      void run(() =>
                        toggleSelect({
                          localDate,
                          habitId: habit.id,
                        }),
                      )
                    }
                    style={[
                      styles.row,
                      selected && styles.rowSelected,
                      actionBusy && styles.rowDisabled,
                    ]}
                  >
                    <Text style={styles.glyph}>{habit.glyph}</Text>
                    <Text style={styles.rowLabel}>{habit.name}</Text>
                  </Pressable>
                );
              })}
            </View>
            <PrimaryButton
              label="Start today"
              disabled={actionBusy || day.session.selectedIds.length === 0}
              onPress={() => void run(() => commit({ localDate }))}
            />
            <GhostButton
              label="Shuffle offer"
              disabled={actionBusy}
              onPress={() => void run(() => rereveal({ localDate }))}
            />
          </View>
        ) : null}

        {phase === "active" ? (
          <View style={styles.block}>
            <Text style={styles.eyebrow}>Today’s Orbit</Text>
            <Text style={styles.title}>Finish these to succeed</Text>
            <View style={styles.list}>
              {committedHabits.map((habit) => {
                if (!habit) {
                  return null;
                }

                const done = day.session.completedIds.includes(habit.id);
                return (
                  <Pressable
                    key={habit.id}
                    disabled={actionBusy}
                    onPress={() =>
                      void run(() =>
                        toggleComplete({
                          localDate,
                          habitId: habit.id,
                        }),
                      )
                    }
                    style={[
                      styles.row,
                      done && styles.rowDone,
                      actionBusy && styles.rowDisabled,
                    ]}
                  >
                    <Text style={styles.glyph}>{done ? "✓" : habit.glyph}</Text>
                    <Text style={styles.rowLabel}>{habit.name}</Text>
                  </Pressable>
                );
              })}
            </View>
            <GhostButton
              label="Release & reshuffle"
              disabled={actionBusy}
              onPress={() => void run(() => rereveal({ localDate }))}
            />
          </View>
        ) : null}

        {phase === "complete" ? (
          <View style={styles.block}>
            <Text style={styles.eyebrow}>Done</Text>
            <Text style={styles.title}>Today’s Orbit complete</Text>
            <Text style={styles.sub}>
              Streak {day.streak} · {day.daysCompleted} days completed
            </Text>
            <View style={styles.list}>
              {committedHabits.map((habit) => {
                if (!habit) {
                  return null;
                }

                return (
                  <View key={habit.id} style={[styles.row, styles.rowDone]}>
                    <Text style={styles.glyph}>✓</Text>
                    <Text style={styles.rowLabel}>{habit.name}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <GhostButton label="Sign out" onPress={() => void handleSignOut()} />
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
  block: { gap: space[3] },
  eyebrow: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: fontSize["2xl"],
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.6,
  },
  sub: {
    fontSize: fontSize.md,
    color: colors.muted,
    lineHeight: 22,
  },
  metrics: { flexDirection: "row", gap: space[2], marginVertical: space[2] },
  chip: {
    alignSelf: "flex-start",
    backgroundColor: colors.primarySoft,
    color: colors.primaryDeep,
    overflow: "hidden",
    paddingHorizontal: space[3],
    paddingVertical: space[1],
    borderRadius: radius.full,
    fontWeight: "700",
    fontSize: fontSize.sm,
  },
  list: { gap: space[2], marginTop: space[2] },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingVertical: space[4],
    paddingHorizontal: space[5],
    borderWidth: 1,
    borderColor: colors.line,
  },
  rowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  rowDone: {
    borderColor: colors.success,
    backgroundColor: colors.successSoft,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  glyph: { fontSize: fontSize.lg, width: 28, textAlign: "center" },
  rowLabel: { fontSize: fontSize.lg, fontWeight: "600", color: colors.ink },
  error: {
    color: colors.primaryDeep,
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
