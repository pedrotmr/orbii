import { type Habit } from "@orbii/backend";
import { type Palette, radius } from "@orbii/tokens";
import { StyleSheet, View } from "react-native";
import { useThemedStyles } from "../../theme/use-theme";
import OrbitHabitRow from "./orbit-habit-row";

interface OrbitHabitListProps {
  habits: Habit[];
  busy: boolean;
  onRemove: (habitKey: string) => void;
}

export default function OrbitHabitList({
  habits,
  busy,
  onRemove,
}: OrbitHabitListProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.list}>
      {habits.map((habit, i) => (
        <View key={habit.id}>
          {i > 0 ? <View style={styles.separator} /> : null}
          <OrbitHabitRow habit={habit} busy={busy} onRemove={onRemove} />
        </View>
      ))}
    </View>
  );
}
const createStyles = (colors: Palette) =>
  StyleSheet.create({
    list: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      overflow: "hidden",
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.line,
      marginLeft: 72,
    },
  });
