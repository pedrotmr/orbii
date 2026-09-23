import Ionicons from "@expo/vector-icons/Ionicons";
import { type Palette, radius, space } from "@orbii/tokens";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, ReduceMotion } from "react-native-reanimated";
import type { TodayHabit } from "../today-habit";
import FocusOrbit from "../../components/ritual/focus-orbit";
import { useTheme, useThemedStyles } from "../../theme/use-theme";

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
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Animated.View
      entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)}
      style={styles.block}
    >
      <Text accessibilityRole="header" style={styles.title}>
        {"Today’s Orbit\ncomplete."}
      </Text>
      <Text style={styles.sub}>
        You made time for what matters. Enjoy the rest of your day.
      </Text>
      {committedHabits.length > 0 ? (
        <>
          <FocusOrbit
            total={committedHabits.length}
            completed={committedHabits.length}
            mode="complete"
          />
          <View style={styles.habits}>
            {committedHabits.map((habit) => (
              <View key={habit.id} style={styles.habit}>
                <Ionicons
                  accessible={false}
                  importantForAccessibility="no-hide-descendants"
                  name="checkmark-circle"
                  size={22}
                  color={colors.primary}
                />
                <Text style={styles.name}>{habit.name}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.value}>{streak}</Text>
          <Text style={styles.label}>
            {streak === 1 ? "day in a row" : "days in a row"}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.value}>{daysCompleted}</Text>
          <Text style={styles.label}>
            {daysCompleted === 1 ? "Orbit completed" : "Orbits completed"}
          </Text>
        </View>
      </View>
      <Text style={styles.tomorrow}>A new focus awaits tomorrow.</Text>
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
    habits: {
      gap: space[3],
      padding: space[4],
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
    },
    habit: { flexDirection: "row", gap: space[3], alignItems: "center" },
    name: { flex: 1, fontSize: 16, lineHeight: 23, color: colors.ink },
    stats: {
      flexDirection: "row",
      marginTop: space[5],
      paddingTop: space[5],
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
    },
    stat: { flex: 1, gap: 4 },
    value: {
      color: colors.ink,
      fontSize: 28,
      fontWeight: "600",
      fontVariant: ["tabular-nums"],
    },
    label: { fontSize: 13, color: colors.muted },
    tomorrow: {
      color: colors.muted,
      fontSize: 14,
      textAlign: "center",
      marginTop: space[4],
    },
  });
