import { Pressable, Text } from "react-native";
import type { TodayHabit } from "../today-habit";
import { todayHabitStyles as styles } from "../today-habit-styles";

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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: done, disabled }}
      disabled={disabled}
      onPress={onToggle}
      style={[
        styles.row,
        done && styles.rowDone,
        disabled && styles.rowDisabled,
      ]}
    >
      <Text style={styles.glyph}>{done ? "✓" : habit.glyph}</Text>
      <Text style={styles.rowLabel}>{habit.name}</Text>
    </Pressable>
  );
}
