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

interface TodayOfferRowProps {
  habit: TodayHabit;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}

export default function TodayOfferRow({
  habit,
  selected,
  disabled,
  onToggle,
}: TodayOfferRowProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const motion = usePressMotion();
  return (
    <AnimatedPressable
      accessibilityRole="checkbox"
      accessibilityLabel={habit.name}
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={() => {
        selectionFeedback();
        onToggle();
      }}
      onPressIn={motion.onPressIn}
      onPressOut={motion.onPressOut}
      style={[
        styles.row,
        selected && styles.selected,
        disabled && !selected && styles.disabled,
        motion.style,
      ]}
    >
      <HabitIcon glyph={habit.glyph} selected={selected} />
      <Text style={styles.name}>{habit.name}</Text>
      <View style={[styles.check, selected && styles.checked]}>
        {selected ? (
          <Animated.View
            entering={FadeIn.duration(120).reduceMotion(ReduceMotion.System)}
          >
            <Ionicons
              accessible={false}
              importantForAccessibility="no-hide-descendants"
              name="checkmark"
              size={18}
              color={colors.onPrimary}
            />
          </Animated.View>
        ) : null}
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
      minHeight: 76,
      padding: space[4],
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.surface,
    },
    selected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    disabled: { opacity: 0.5 },
    name: {
      flex: 1,
      fontSize: 17,
      lineHeight: 23,
      color: colors.ink,
      fontWeight: "600",
    },
    check: {
      width: 26,
      height: 26,
      borderRadius: radius.full,
      borderWidth: 1.5,
      borderColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    checked: { borderColor: colors.primary, backgroundColor: colors.primary },
  });
