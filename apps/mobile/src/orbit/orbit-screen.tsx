import { api, type HabitCategory } from "@orbii/backend";
import { colors, fontSize, space } from "@orbii/tokens";
import { useMutation, useQuery } from "convex/react";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTodayLocal } from "../local-date";
import OrbitAddHabitForm from "./add/orbit-add-habit-form";
import OrbitHabitList from "./list/orbit-habit-list";

const slugify = (name: string) => {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (base.length > 0) {
    return base;
  }

  return "habit";
};

export default function OrbitScreen() {
  const localDate = useTodayLocal();
  const habits = useQuery(api.habits.list, {});
  const addHabit = useMutation(api.habits.add);
  const removeHabit = useMutation(api.habits.remove);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<unknown>) => {
    if (busy) {
      return;
    }

    try {
      setBusy(true);
      setError(null);
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      throw e;
    } finally {
      setBusy(false);
    }
  };

  if (habits === undefined) {
    return (
      <SafeAreaView style={styles.boot}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  const handleAdd = async (input: {
    name: string;
    glyph: string;
    category: HabitCategory;
  }) => {
    await run(async () => {
      await addHabit({
        habitKey: `custom-${slugify(input.name)}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: input.name,
        glyph: input.glyph,
        category: input.category,
      });
    });
  };

  const handleRemove = (habitKey: string) => {
    void run(async () => {
      await removeHabit({ habitKey, localDate });
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.brand}>Orbii</Text>
        <Text style={styles.eyebrow}>Orbit</Text>
        <Text style={styles.title}>Habits you keep in life</Text>
        <Text style={styles.sub}>
          Add freely. You won’t do all of these every day — that’s the point.
        </Text>

        <Text style={styles.count}>{habits.length} in Orbit</Text>

        <OrbitHabitList habits={habits} busy={busy} onRemove={handleRemove} />

        <OrbitAddHabitForm busy={busy} onAdd={handleAdd} />

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
  },
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    padding: space[6],
    paddingBottom: space[12],
    gap: space[3],
  },
  brand: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.3,
  },
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
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: fontSize.md,
    color: colors.muted,
    lineHeight: 22,
  },
  count: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.ink,
    marginTop: space[2],
  },
  error: {
    color: colors.primaryDeep,
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
