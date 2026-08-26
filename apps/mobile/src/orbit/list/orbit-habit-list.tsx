import { type Habit } from "@orbii/backend";
import { space } from "@orbii/tokens";
import { StyleSheet, View } from "react-native";
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
  return (
    <View style={styles.list}>
      {habits.map((habit) => (
        <OrbitHabitRow
          key={habit.id}
          habit={habit}
          busy={busy}
          onRemove={onRemove}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: space[2] },
});
