import Ionicons from "@expo/vector-icons/Ionicons";
import { type Habit } from "@orbii/backend";
import { type Palette, radius, space } from "@orbii/tokens";
import { Pressable, StyleSheet, Text, View } from "react-native";
import HabitIcon from "../../components/habits/habit-icon";
import { useTheme, useThemedStyles } from "../../theme/use-theme";

interface OrbitHabitRowProps {
  habit: Habit;
  busy: boolean;
  active: boolean;
  drag: () => void;
  onEdit: (habitKey: string) => void;
  onRemove: (habitKey: string) => void;
}

export default function OrbitHabitRow({
  habit,
  busy,
  active,
  drag,
  onEdit,
  onRemove,
}: OrbitHabitRowProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.row, active && styles.active]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Edit ${habit.name}`}
        accessibilityState={{ disabled: busy }}
        disabled={busy}
        onPress={() => onEdit(habit.id)}
        style={({ pressed }) => [
          styles.content,
          busy && styles.disabled,
          pressed && !busy && styles.pressed,
        ]}
      >
        <HabitIcon glyph={habit.glyph} />
        <View style={styles.meta}>
          <Text style={styles.name}>{habit.name}</Text>
          <Text style={styles.category}>{habit.category}</Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Reorder ${habit.name}`}
        accessibilityHint="Press and hold, then drag to move this habit"
        accessibilityState={{ disabled: busy }}
        disabled={busy}
        onLongPress={drag}
        delayLongPress={250}
        style={({ pressed }) => [
          styles.reorder,
          busy && styles.disabled,
          pressed && !busy && styles.pressed,
        ]}
      >
        <Ionicons
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          name="reorder-three-outline"
          size={23}
          color={colors.muted}
        />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Remove ${habit.name}`}
        accessibilityState={{ disabled: busy }}
        disabled={busy}
        onPress={() => onRemove(habit.id)}
        style={({ pressed }) => [
          styles.remove,
          busy && styles.disabled,
          pressed && !busy && styles.pressed,
        ]}
      >
        <Ionicons
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          name="remove-circle-outline"
          size={23}
          color={colors.muted}
        />
      </Pressable>
    </View>
  );
}
const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[3],
      paddingLeft: space[4],
      paddingRight: space[2],
      backgroundColor: colors.surface,
    },
    active: { backgroundColor: colors.bgMid, borderRadius: radius.md },
    content: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: space[3],
      minHeight: 80,
      paddingVertical: space[3],
    },
    meta: { flex: 1, gap: 4 },
    name: {
      fontSize: 17,
      lineHeight: 23,
      fontWeight: "500",
      color: colors.ink,
    },
    category: {
      fontSize: 13,
      color: colors.muted,
      textTransform: "capitalize",
    },
    remove: {
      minWidth: 48,
      minHeight: 48,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.full,
    },
    reorder: {
      minWidth: 48,
      minHeight: 48,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.full,
    },
    disabled: { opacity: 0.5 },
    pressed: { backgroundColor: colors.primarySoft },
  });
