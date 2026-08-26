import { colors, fontSize, space } from "@orbii/tokens";
import { StyleSheet, Text, View } from "react-native";
import type { TodayHabit } from "../today-habit";
import Metric from "../../components/metric";
import { todayHabitStyles } from "../today-habit-styles";

interface TodayCompletePhaseProps {
  streak: number;
  daysCompleted: number;
  committedHabits: TodayHabit[];
}

export default function TodayCompletePhase({
  streak,
  daysCompleted,
  committedHabits,
}: TodayCompletePhaseProps) {
  return (
    <View style={styles.block}>
      <Text style={styles.eyebrow}>Done</Text>
      <Text style={styles.title}>Today’s Orbit complete</Text>
      <Text style={styles.sub}>
        Success is finishing today’s focus — not covering the whole Orbit.
      </Text>
      <View style={styles.metrics}>
        <Metric label="Day streak" value={String(streak)} />
        <Metric label="Days completed" value={String(daysCompleted)} />
      </View>
      <View style={todayHabitStyles.list}>
        {committedHabits.map((habit) => (
          <View
            key={habit.id}
            style={[todayHabitStyles.row, todayHabitStyles.rowDone]}
          >
            <Text style={todayHabitStyles.glyph}>✓</Text>
            <Text style={todayHabitStyles.rowLabel}>{habit.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  metrics: { flexDirection: "row", gap: space[2], marginVertical: space[1] },
});
