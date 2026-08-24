import { OFFER_SIZE } from "@orbii/backend";
import { colors, fontSize, radius, space } from "@orbii/tokens";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  doCommit,
  doRereveal,
  doStartReveal,
  doToggleComplete,
  doToggleSelect,
  loadSlice,
  resetDemo,
  saveSlice,
  seedEasyOrbit,
  type SliceState,
} from "./src/sliceStore";

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

export default function App() {
  const [state, setState] = useState<SliceState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const loaded = await loadSlice();
      setState(loaded);
    })();
  }, []);

  const persist = useCallback(async (next: SliceState) => {
    setState(next);
    await saveSlice(next);
  }, []);

  const offeredHabits = useMemo(() => {
    if (!state) {
      return [];
    }
    return state.session.offeredIds
      .map((id) => state.habits.find((h) => h.id === id))
      .filter(Boolean);
  }, [state]);

  const committedHabits = useMemo(() => {
    if (!state) {
      return [];
    }
    return state.session.committedIds
      .map((id) => state.habits.find((h) => h.id === id))
      .filter(Boolean);
  }, [state]);

  if (!state) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const run = async (fn: () => SliceState) => {
    try {
      setError(null);
      await persist(fn());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  };

  const phase = state.session.phase;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.brand}>Orbii</Text>

          {state.habits.length === 0 ? (
            <View style={styles.block}>
              <Text style={styles.title}>Build your Orbit</Text>
              <Text style={styles.sub}>
                Seed a few easy habits so you can always pick something
                manageable.
              </Text>
              <PrimaryButton
                label="Seed starter Orbit"
                onPress={() => void run(() => seedEasyOrbit(state))}
              />
            </View>
          ) : null}

          {state.habits.length > 0 && phase === "idle" ? (
            <View style={styles.block}>
              <Text style={styles.title}>Ready for today’s Orbit?</Text>
              <Text style={styles.sub}>
                We’ll offer {Math.min(OFFER_SIZE, state.habits.length)} options.
                Pick up to {state.capacity} you can actually do.
              </Text>
              <View style={styles.metrics}>
                <Metric label="In Orbit" value={String(state.habits.length)} />
                <Metric label="Day streak" value={String(state.stats.streak)} />
                <Metric label="Capacity" value={String(state.capacity)} />
              </View>
              <PrimaryButton
                label="See today’s options"
                onPress={() => void run(() => doStartReveal(state))}
              />
            </View>
          ) : null}

          {phase === "reveal" ? (
            <View style={styles.block}>
              <Text style={styles.eyebrow}>Today’s offer</Text>
              <Text style={styles.title}>What can you take on?</Text>
              <Text style={styles.sub}>
                Pick up to {state.capacity}. Low energy — just don’t choose what
                won’t work today.
              </Text>
              <Text style={styles.chip}>
                {state.session.selectedIds.length}/{state.capacity}
              </Text>
              <View style={styles.list}>
                {offeredHabits.map((habit) => {
                  if (!habit) {
                    return null;
                  }
                  const selected = state.session.selectedIds.includes(habit.id);
                  return (
                    <Pressable
                      key={habit.id}
                      onPress={() =>
                        void run(() => doToggleSelect(state, habit.id))
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
                disabled={state.session.selectedIds.length === 0}
                onPress={() => void run(() => doCommit(state))}
              />
              <GhostButton
                label="Shuffle offer"
                onPress={() => void run(() => doRereveal(state))}
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
                  const done = state.session.completedIds.includes(habit.id);
                  return (
                    <Pressable
                      key={habit.id}
                      onPress={() =>
                        void run(() => doToggleComplete(state, habit.id))
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
                onPress={() => void run(() => doRereveal(state))}
              />
            </View>
          ) : null}

          {phase === "complete" ? (
            <View style={styles.block}>
              <Text style={styles.eyebrow}>Done</Text>
              <Text style={styles.title}>Today’s Orbit complete</Text>
              <Text style={styles.sub}>
                Streak {state.stats.streak} · {state.stats.daysCompleted} days
                completed
              </Text>
              <View style={styles.list}>
                {committedHabits.map((habit) =>
                  habit ? (
                    <View key={habit.id} style={[styles.row, styles.rowDone]}>
                      <Text style={styles.glyph}>✓</Text>
                      <Text style={styles.rowLabel}>{habit.name}</Text>
                    </View>
                  ) : null,
                )}
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
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
  error: { color: colors.primaryDeep, fontSize: fontSize.sm },
});
