import { type Habit } from "@orbii/backend";
import { colors, fontSize, radius, space } from "@orbii/tokens";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface OrbitHabitRowProps {
  habit: Habit;
  busy: boolean;
  onRemove: (habitKey: string) => void;
}

export default function OrbitHabitRow({
  habit,
  busy,
  onRemove,
}: OrbitHabitRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.glyph}>{habit.glyph}</Text>
      <View style={styles.meta}>
        <Text style={styles.name}>{habit.name}</Text>
        <Text style={styles.category}>{habit.category}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Remove ${habit.name}`}
        disabled={busy}
        onPress={() => onRemove(habit.id)}
        style={styles.remove}
      >
        <Text style={styles.removeText}>Remove</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    borderWidth: 1,
    borderColor: colors.line,
  },
  glyph: { fontSize: fontSize.lg, width: 28, textAlign: "center" },
  meta: { flex: 1, gap: 2 },
  name: { fontSize: fontSize.md, fontWeight: "600", color: colors.ink },
  category: {
    fontSize: fontSize.xs,
    color: colors.muted,
    textTransform: "capitalize",
  },
  remove: {
    paddingHorizontal: space[2],
    paddingVertical: space[1],
  },
  removeText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.primaryDeep,
  },
});
