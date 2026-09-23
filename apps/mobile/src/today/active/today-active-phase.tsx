import { type Palette, space } from "@orbii/tokens";
import { Alert, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, ReduceMotion } from "react-native-reanimated";
import type { TodayHabit } from "../today-habit";
import GhostButton from "../../components/ghost-button";
import FocusOrbit from "../../components/ritual/focus-orbit";
import { useThemedStyles } from "../../theme/use-theme";
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
  const styles = useThemedStyles(createStyles);
  const completed = committedHabits.filter((habit) =>
    completedIds.includes(habit.id),
  ).length;
  return (
    <Animated.View
      entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)}
      style={styles.block}
    >
      <Text accessibilityRole="header" style={styles.title}>
        {"Just these.\nJust today."}
      </Text>
      <Text style={styles.sub}>A little attention goes a long way.</Text>
      <FocusOrbit
        total={committedHabits.length}
        completed={completed}
        mode="active"
        compact
      />
      <View style={styles.list}>
        {committedHabits.map((habit) => (
          <TodayCommittedRow
            key={habit.id}
            habit={habit}
            done={completedIds.includes(habit.id)}
            disabled={busy}
            onToggle={() => onToggle(habit.id)}
          />
        ))}
      </View>
      <GhostButton
        label="Choose a different focus"
        disabled={busy}
        onPress={() =>
          Alert.alert(
            "Change today’s focus?",
            "Your current selection and checkmarks will be released. You can choose again.",
            [
              { text: "Keep my focus", style: "cancel" },
              { text: "Choose again", onPress: onReshuffle },
            ],
          )
        }
      />
    </Animated.View>
  );
}
const createStyles = (colors: Palette) =>
  StyleSheet.create({
    block: { gap: space[3], flexGrow: 1 },
    title: {
      fontSize: 34,
      lineHeight: 39,
      fontWeight: "700",
      color: colors.ink,
      letterSpacing: -1,
    },
    sub: { fontSize: 16, lineHeight: 24, color: colors.muted },
    list: { gap: space[2], marginTop: space[2] },
  });
