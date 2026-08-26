import { colors, fontSize, space } from "@orbii/tokens";
import { StyleSheet, Text, View } from "react-native";
import type { TodayHabit } from "../today-habit";
import GhostButton from "../../components/ghost-button";
import { todayHabitStyles } from "../today-habit-styles";
import TodayCommittedRow from "./today-committed-row";

interface TodayActivePhaseProps {
  committedHabits: TodayHabit[];
  completedIds: string[];
  busy: boolean;
  onToggle: (habitId: string) => void;
  onReshuffle: () => void;
}

export default function TodayActivePhase({
  committedHabits,
  completedIds,
  busy,
  onToggle,
  onReshuffle,
}: TodayActivePhaseProps) {
  return (
    <View style={styles.block}>
      <Text style={styles.eyebrow}>Today’s Orbit</Text>
      <Text style={styles.title}>Finish these to succeed</Text>
      <View style={todayHabitStyles.list}>
        {committedHabits.map((habit) => {
          const done = completedIds.includes(habit.id);
          return (
            <TodayCommittedRow
              key={habit.id}
              habit={habit}
              done={done}
              disabled={busy}
              onToggle={() => onToggle(habit.id)}
            />
          );
        })}
      </View>
      <GhostButton
        label="Release & reshuffle"
        disabled={busy}
        onPress={onReshuffle}
      />
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
});
