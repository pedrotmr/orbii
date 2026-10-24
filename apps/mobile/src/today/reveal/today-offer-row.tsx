import Ionicons from "@expo/vector-icons/Ionicons";
import { type Palette, radius, space } from "@orbii/tokens";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
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
      accessibilityLabel={`${habit.name}, ${habit.pointValue} points`}
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
      <View style={styles.leading}>
        <HabitIcon glyph={habit.glyph} selected={selected} size={36} />
        <Text numberOfLines={1} style={styles.name}>
          {habit.name}
        </Text>
      </View>
      <Text style={styles.points}>{habit.pointValue} points</Text>
      <View
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.selection, selected && styles.selectionSelected]}
      >
        {selected ? (
          <Ionicons
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            name="checkmark"
            size={16}
            color={colors.onPrimary}
          />
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: {
      minHeight: 60,
      flexDirection: "row",
      alignItems: "center",
      gap: space[2],
      paddingHorizontal: space[3],
      paddingVertical: space[2],
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      borderRadius: radius.lg,
    },
    selected: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
    },
    disabled: { opacity: 0.5 },
    leading: {
      flex: 1,
      minWidth: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: space[3],
    },
    name: {
      flex: 1,
      minWidth: 0,
      fontSize: 16,
      lineHeight: 20,
      color: colors.ink,
      fontWeight: "600",
    },
    points: {
      minWidth: 66,
      color: colors.primary,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "600",
      textAlign: "right",
    },
    selection: {
      width: 24,
      height: 24,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: colors.muted,
      borderRadius: radius.full,
    },
    selectionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
  });
