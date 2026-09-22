import Ionicons from "@expo/vector-icons/Ionicons";
import { type Palette, radius, space } from "@orbii/tokens";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, ReduceMotion } from "react-native-reanimated";
import type { TodayHabit } from "../today-habit";
import { selectionFeedback } from "../../components/controls/feedback";
import { usePressMotion } from "../../components/controls/use-press-motion";
import HabitIcon from "../../components/habits/habit-icon";
import { useTheme, useThemedStyles } from "../../theme/use-theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TodayCommittedRowProps {
  habit: TodayHabit;
  done: boolean;
  disabled: boolean;
  onToggle: () => void;
}

export default function TodayCommittedRow({
  habit,
  done,
  disabled,
  onToggle,
}: TodayCommittedRowProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const motion = usePressMotion();
  return (
    <AnimatedPressable
      accessibilityRole="checkbox"
      accessibilityLabel={habit.name}
      accessibilityHint={done ? "Mark as unfinished" : "Mark as completed"}
      accessibilityState={{ checked: done, disabled }}
      disabled={disabled}
      onPress={() => {
        selectionFeedback();
        onToggle();
      }}
      onPressIn={motion.onPressIn}
      onPressOut={motion.onPressOut}
      style={[styles.row, done && styles.done, motion.style]}
    >
      <HabitIcon glyph={habit.glyph} />
      <View style={styles.meta}>
        <Text style={[styles.name, done && styles.doneName]}>{habit.name}</Text>
        <Text style={styles.hint}>
          {done ? "Done for today" : "Tap when you’re done"}
        </Text>
      </View>
      <View style={[styles.check, done && styles.checked]}>
        {done ? (
          <Animated.View
            entering={FadeIn.duration(120).reduceMotion(ReduceMotion.System)}
          >
            <Ionicons
              accessible={false}
              importantForAccessibility="no-hide-descendants"
              name="checkmark"
              size={22}
              color={colors.onPrimary}
            />
          </Animated.View>
        ) : (
          <Ionicons
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            name="add"
            size={20}
            color={colors.muted}
          />
        )}
      </View>
    </AnimatedPressable>
  );
}
const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[3],
      minHeight: 86,
      padding: space[4],
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
    },
    done: { backgroundColor: colors.bgMid },
    meta: { flex: 1, gap: 4 },
    name: {
      fontSize: 18,
      lineHeight: 24,
      color: colors.ink,
      fontWeight: "600",
    },
    doneName: { color: colors.muted },
    hint: { color: colors.muted, fontSize: 13 },
    check: {
      width: 34,
      height: 34,
      borderRadius: radius.full,
      borderWidth: 1.5,
      borderColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    checked: { backgroundColor: colors.primary, borderColor: colors.primary },
  });
