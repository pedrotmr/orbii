import { api, EASY_STARTER_IDS, OFFER_SIZE } from "@orbii/backend";
import { colors, fontSize, radius, space } from "@orbii/tokens";
import { useMutation, useQuery } from "convex/react";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
  deviceTimezone,
  loadOrCreateClientUserId,
  rotateClientUserId,
  todayLocal,
} from "./src/clientIdentity";

const SEED_HABIT_KEYS = [...EASY_STARTER_IDS, "read", "journal"];

function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryBtn,
        disabled && styles.primaryBtnDisabled,
        pressed && !disabled && { opacity: 0.9 },
      ]}
    >
      <Text style={styles.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

function GhostButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.ghostBtn}
    >
      <Text style={styles.ghostBtnText}>{label}</Text>
    </Pressable>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export default function App() {
  const [clientUserId, setClientUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const localDate = todayLocal();

  const ensureUser = useMutation(api.users.ensure);
  const seedStarters = useMutation(api.habits.seedStarters);
  const startReveal = useMutation(api.day.startRevealMutation);
  const toggleSelect = useMutation(api.day.toggleSelect);
  const commit = useMutation(api.day.commit);
  const toggleComplete = useMutation(api.day.toggleComplete);
  const rereveal = useMutation(api.day.rereveal);

  useEffect(() => {
    void (async () => {
      try {
        const id = await loadOrCreateClientUserId();
        await ensureUser({
          clientUserId: id,
          timezone: deviceTimezone(),
        });
        setClientUserId(id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to connect");
      }
    })();
  }, [ensureUser]);

  const day = useQuery(
    api.day.get,
    clientUserId ? { clientUserId, localDate } : "skip",
  );
  const habits = useQuery(
    api.habits.list,
    clientUserId ? { clientUserId } : "skip",
  );

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
    try {
      setError(null);
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  };

  const resetDemo = async () => {
    const id = await rotateClientUserId();
    await ensureUser({
      clientUserId: id,
      timezone: deviceTimezone(),
    });
    await seedStarters({
      clientUserId: id,
      habitKeys: SEED_HABIT_KEYS,
    });
    setClientUserId(id);
  };

  if (!clientUserId || day === undefined || habits === undefined) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.primary} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }

  if (day === null) {
    return (
      <View style={styles.boot}>
        <Text style={styles.error}>
          {error ?? "User not ready — try Reset demo data"}
        </Text>
      </View>
    );
  }

  const phase = day.session.phase;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.brand}>Orbii</Text>

          {habits.length === 0 ? (
            <View style={styles.block}>
              <Text style={styles.title}>Build your Orbit</Text>
              <Text style={styles.sub}>
                Seed a few easy habits so you can always pick something
                manageable.
              </Text>
              <PrimaryButton
                label="Seed starter Orbit"
                onPress={() =>
                  void run(() =>
                    seedStarters({
                      clientUserId,
                      habitKeys: SEED_HABIT_KEYS,
                    }),
                  )
                }
              />
            </View>
          ) : null}

          {habits.length > 0 && phase === "idle" ? (
            <View style={styles.block}>
              <Text style={styles.title}>Ready for today’s Orbit?</Text>
              <Text style={styles.sub}>
                We’ll offer {Math.min(OFFER_SIZE, habits.length)} options. Pick
                up to {day.capacity} you can actually do.
              </Text>
              <View style={styles.metrics}>
                <Metric label="In Orbit" value={String(habits.length)} />
                <Metric label="Day streak" value={String(day.streak)} />
                <Metric label="Capacity" value={String(day.capacity)} />
              </View>
              <PrimaryButton
                label="See today’s options"
                onPress={() =>
                  void run(() => startReveal({ clientUserId, localDate }))
                }
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
                      onPress={() =>
                        void run(() =>
                          toggleSelect({
                            clientUserId,
                            localDate,
                            habitId: habit.id,
                          }),
                        )
                      }
                      style={[styles.row, selected && styles.rowSelected]}
                    >
                      <Text style={styles.glyph}>{habit.glyph}</Text>
                      <Text style={styles.rowLabel}>{habit.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <PrimaryButton
                label="Start today"
                disabled={day.session.selectedIds.length === 0}
                onPress={() =>
                  void run(() => commit({ clientUserId, localDate }))
                }
              />
              <GhostButton
                label="Shuffle offer"
                onPress={() =>
                  void run(() => rereveal({ clientUserId, localDate }))
                }
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
                      onPress={() =>
                        void run(() =>
                          toggleComplete({
                            clientUserId,
                            localDate,
                            habitId: habit.id,
                          }),
                        )
                      }
                      style={[styles.row, done && styles.rowDone]}
                    >
                      <Text style={styles.glyph}>
                        {done ? "✓" : habit.glyph}
                      </Text>
                      <Text style={styles.rowLabel}>{habit.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <GhostButton
                label="Release & reshuffle"
                onPress={() =>
                  void run(() => rereveal({ clientUserId, localDate }))
                }
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

          <GhostButton
            label="Reset demo data"
            onPress={() => void run(() => resetDemo())}
          />
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
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
  metric: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space[3],
    borderWidth: 1,
    borderColor: colors.line,
  },
  metricValue: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.ink,
  },
  metricLabel: { fontSize: fontSize.xs, color: colors.muted, marginTop: 2 },
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
  glyph: { fontSize: fontSize.lg, width: 28, textAlign: "center" },
  rowLabel: { fontSize: fontSize.lg, fontWeight: "600", color: colors.ink },
  primaryBtn: {
    marginTop: space[2],
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: space[4],
    alignItems: "center",
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: {
    color: colors.onPrimary,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  ghostBtn: { paddingVertical: space[3], alignItems: "center" },
  ghostBtnText: {
    color: colors.muted,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  error: {
    color: colors.primaryDeep,
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
