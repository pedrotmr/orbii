import { MAX_CAPACITY, MIN_CAPACITY } from "@orbii/backend";
import { colors, fontSize, radius, space } from "@orbii/tokens";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface SettingsCapacitySectionProps {
  capacity: number;
  busy: boolean;
  onChange: (capacity: number) => void;
}

const OPTIONS = Array.from(
  { length: MAX_CAPACITY - MIN_CAPACITY + 1 },
  (_, i) => MIN_CAPACITY + i,
);

export default function SettingsCapacitySection({
  capacity,
  busy,
  onChange,
}: SettingsCapacitySectionProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Daily capacity</Text>
      <Text style={styles.hint}>
        Max habits you pick from today’s offer (1–5).
      </Text>
      <View style={styles.picker}>
        {OPTIONS.map((value) => {
          const selected = value === capacity;
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              disabled={busy}
              onPress={() => onChange(value)}
              style={[styles.option, selected && styles.optionSelected]}
            >
              <Text
                style={[
                  styles.optionText,
                  selected && styles.optionTextSelected,
                ]}
              >
                {value}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[2] },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.ink,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.muted,
    lineHeight: 20,
  },
  picker: {
    flexDirection: "row",
    gap: space[2],
    justifyContent: "space-between",
    marginTop: space[1],
  },
  option: {
    flex: 1,
    alignItems: "center",
    paddingVertical: space[4],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  optionText: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.muted,
  },
  optionTextSelected: { color: colors.primaryDeep },
});
