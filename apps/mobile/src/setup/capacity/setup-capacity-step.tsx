import { DEFAULT_CAPACITY, MAX_CAPACITY, MIN_CAPACITY } from "@orbii/backend";
import { colors, fontSize, radius, space } from "@orbii/tokens";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import PrimaryButton from "../../components/primary-button";

interface SetupCapacityStepProps {
  busy: boolean;
  onFinish: (capacity: number) => void;
}

const OPTIONS = Array.from(
  { length: MAX_CAPACITY - MIN_CAPACITY + 1 },
  (_, i) => MIN_CAPACITY + i,
);

export default function SetupCapacityStep({
  busy,
  onFinish,
}: SetupCapacityStepProps) {
  const [capacity, setCapacity] = useState(DEFAULT_CAPACITY);

  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>Daily focus</Text>
      <Text style={styles.title}>How many can you take on?</Text>
      <Text style={styles.body}>
        Capacity is the max you pick from today’s offer. Default is{" "}
        {DEFAULT_CAPACITY} — you can change this later in Settings.
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
              onPress={() => setCapacity(value)}
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

      <PrimaryButton
        label="Open Today"
        disabled={busy}
        onPress={() => onFinish(capacity)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[3], flex: 1, justifyContent: "center" },
  eyebrow: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: fontSize["2xl"],
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  body: {
    fontSize: fontSize.md,
    color: colors.muted,
    lineHeight: 22,
    marginBottom: space[2],
  },
  picker: {
    flexDirection: "row",
    gap: space[2],
    justifyContent: "space-between",
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
