import { Pressable, Text } from "react-native";
import type { TodayHabit } from "../today-habit";
import { todayHabitStyles as styles } from "../today-habit-styles";

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
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onToggle}
      style={[
        styles.row,
        selected && styles.rowSelected,
        disabled && styles.rowDisabled,
      ]}
    >
      <Text style={styles.glyph}>{habit.glyph}</Text>
      <Text style={styles.rowLabel}>{habit.name}</Text>
    </Pressable>
  );
}
