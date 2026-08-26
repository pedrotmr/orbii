import { type HabitCategory } from "@orbii/backend";
import { colors, fontSize, radius, space } from "@orbii/tokens";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import GhostButton from "../../components/ghost-button";

interface OrbitAddHabitFormProps {
  busy: boolean;
  onAdd: (input: {
    name: string;
    glyph: string;
    category: HabitCategory;
  }) => void;
}

const CATEGORIES: HabitCategory[] = ["body", "mind", "learn", "life"];

export default function OrbitAddHabitForm({
  busy,
  onAdd,
}: OrbitAddHabitFormProps) {
  const [name, setName] = useState("");
  const [glyph, setGlyph] = useState("●");
  const [category, setCategory] = useState<HabitCategory>("life");

  const handleAdd = () => {
    const trimmed = name.trim();

    if (trimmed.length === 0 || busy) {
      return;
    }

    onAdd({
      name: trimmed,
      glyph: glyph.trim() || "●",
      category,
    });
    setName("");
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Add a habit</Text>
      <TextInput
        accessibilityLabel="Habit name"
        placeholder="e.g. Call mom"
        placeholderTextColor={colors.muted}
        value={name}
        onChangeText={setName}
        style={styles.input}
        editable={!busy}
        onSubmitEditing={handleAdd}
        returnKeyType="done"
      />
      <View style={styles.row}>
        <TextInput
          accessibilityLabel="Glyph"
          value={glyph}
          onChangeText={setGlyph}
          style={[styles.input, styles.glyphInput]}
          editable={!busy}
          maxLength={10}
        />
        <View style={styles.categories}>
          {CATEGORIES.map((item) => {
            const selected = item === category;
            return (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled: busy }}
                disabled={busy}
                onPress={() => setCategory(item)}
                style={[styles.catChip, selected && styles.catChipSelected]}
              >
                <Text
                  style={[
                    styles.catChipText,
                    selected && styles.catChipTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <GhostButton
        label="Add habit"
        disabled={busy || name.trim().length === 0}
        onPress={handleAdd}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[3] },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.ink,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    fontSize: fontSize.md,
    color: colors.ink,
  },
  row: { flexDirection: "row", gap: space[2], alignItems: "center" },
  glyphInput: { width: 56, textAlign: "center" },
  categories: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space[1],
  },
  catChip: {
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  catChipSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  catChipText: {
    fontSize: fontSize.xs,
    color: colors.muted,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  catChipTextSelected: { color: colors.accent },
});
