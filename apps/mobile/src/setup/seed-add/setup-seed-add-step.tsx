import {
  api,
  EASY_STARTER_IDS,
  STARTER_HABITS,
  type Habit,
} from "@orbii/backend";
import { type Palette, radius, space } from "@orbii/tokens";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import GhostButton from "../../components/ghost-button";
import HabitIcon from "../../components/habits/habit-icon";
import PrimaryButton from "../../components/primary-button";
import { useThemedStyles } from "../../theme/use-theme";

interface SetupSeedAddStepProps {
  habits: Habit[];
  busy: boolean;
  onContinue: () => void;
  run: (fn: () => Promise<unknown>) => Promise<void>;
}
const easyIds = new Set<string>(EASY_STARTER_IDS);
const easyStarters = STARTER_HABITS.filter((habit) => easyIds.has(habit.id));

export default function SetupSeedAddStep({
  habits,
  busy,
  onContinue,
  run,
}: SetupSeedAddStepProps) {
  const styles = useThemedStyles(createStyles);
  const seedStarters = useMutation(api.habits.seedStarters);
  const router = useRouter();
  return (
    <View style={styles.wrap}>
      <Text accessibilityRole="header" style={styles.title}>
        What’s in your Orbit?
      </Text>
      <Text style={styles.body}>
        Start with a few easy habits, or add something of your own.
      </Text>
      <View style={styles.starters}>
        {easyStarters.map((habit) => (
          <View key={habit.id} style={styles.starter}>
            <HabitIcon glyph={habit.glyph} size={36} />
            <Text style={styles.name}>{habit.name}</Text>
          </View>
        ))}
        <GhostButton
          label="Add these easy habits"
          disabled={
            busy ||
            easyStarters.every((starter) =>
              habits.some((habit) => habit.id === starter.id),
            )
          }
          onPress={() =>
            void run(() => seedStarters({ habitKeys: [...EASY_STARTER_IDS] }))
          }
        />
      </View>
      <Text style={styles.section}>Or make it your own</Text>
      <GhostButton
        label="Create a habit"
        disabled={busy}
        onPress={() => router.push("/habit-create")}
      />
      {habits.length > 0 ? (
        <Text accessibilityLiveRegion="polite" style={styles.saved}>
          {habits.length} {habits.length === 1 ? "habit is" : "habits are"} in
          your Orbit. You’re ready.
        </Text>
      ) : (
        <Text style={styles.hint}>Add at least one habit to continue.</Text>
      )}
      <PrimaryButton
        label="Continue"
        disabled={busy || habits.length === 0}
        onPress={onContinue}
      />
    </View>
  );
}
const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: { gap: space[4] },
    title: {
      fontSize: 32,
      lineHeight: 38,
      fontWeight: "700",
      color: colors.ink,
      letterSpacing: -0.8,
    },
    body: { color: colors.muted, fontSize: 16, lineHeight: 24 },
    starters: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: space[4],
      gap: space[3],
    },
    starter: { flexDirection: "row", alignItems: "center", gap: space[3] },
    name: { flex: 1, color: colors.ink, fontSize: 16 },
    section: {
      color: colors.ink,
      fontSize: 18,
      fontWeight: "600",
      marginTop: space[3],
    },
    saved: { color: colors.primaryDeep, fontSize: 14, lineHeight: 21 },
    hint: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  });
