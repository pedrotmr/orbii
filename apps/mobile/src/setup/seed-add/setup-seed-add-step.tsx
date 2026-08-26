import {
  api,
  EASY_STARTER_IDS,
  STARTER_HABITS,
  type Habit,
  type HabitCategory,
} from "@orbii/backend";
import { colors, fontSize, radius, space } from "@orbii/tokens";
import { useMutation } from "convex/react";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import GhostButton from "../../components/ghost-button";
import PrimaryButton from "../../components/primary-button";

interface SetupSeedAddStepProps {
  habits: Habit[];
  busy: boolean;
  onContinue: () => void;
  run: (fn: () => Promise<unknown>) => Promise<void>;
}

const CATEGORIES: HabitCategory[] = ["body", "mind", "learn", "life"];
const EASY_ID_SET = new Set<string>(EASY_STARTER_IDS);

const slugify = (name: string) => {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (base.length > 0) {
    return base;
  }

  return "habit";
};

export default function SetupSeedAddStep({
  habits,
  busy,
  onContinue,
  run,
}: SetupSeedAddStepProps) {
  const seedStarters = useMutation(api.habits.seedStarters);
  const addHabit = useMutation(api.habits.add);
  const [name, setName] = useState("");
  const [glyph, setGlyph] = useState("●");
  const [category, setCategory] = useState<HabitCategory>("life");

  const easyStarters = STARTER_HABITS.filter((h) => EASY_ID_SET.has(h.id));

  const handleSeed = () => {
    void run(() => seedStarters({ habitKeys: [...EASY_STARTER_IDS] }));
  };

  const handleAdd = () => {
    const trimmed = name.trim();

    if (trimmed.length === 0 || busy) {
      return;
    }

    const habitKey = `custom-${slugify(trimmed)}-${Date.now()}`;
    void run(async () => {
      await addHabit({
        habitKey,
        name: trimmed,
        glyph: glyph.trim() || "●",
        category,
      });
      setName("");
    });
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>Your Orbit</Text>
      <Text style={styles.title}>Start with something manageable</Text>
      <Text style={styles.body}>
        Seed easy habits in one tap, or add your own. You need at least one
        before Today opens.
      </Text>

      <GhostButton
        label="Start with easy habits"
        disabled={busy}
        onPress={handleSeed}
      />

      <View style={styles.easyList}>
        {easyStarters.map((habit) => (
          <Text key={habit.id} style={styles.easyChip}>
            {habit.glyph} {habit.name}
          </Text>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Or add a habit</Text>
      <TextInput
        accessibilityLabel="Habit name"
        placeholder="e.g. Call mom"
        placeholderTextColor={colors.muted}
        value={name}
        onChangeText={setName}
        style={styles.input}
        editable={!busy}
      />
      <View style={styles.row}>
        <TextInput
          accessibilityLabel="Glyph"
          value={glyph}
          onChangeText={setGlyph}
          style={[styles.input, styles.glyphInput]}
          editable={!busy}
          maxLength={2}
        />
        <View style={styles.categories}>
          {CATEGORIES.map((item) => {
            const selected = item === category;
            return (
              <Pressable
                key={item}
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

      {habits.length > 0 ? (
        <View style={styles.orbitList}>
          <Text style={styles.sectionLabel}>{habits.length} in Orbit</Text>
          {habits.map((habit) => (
            <View key={habit.id} style={styles.orbitRow}>
              <Text style={styles.orbitGlyph}>{habit.glyph}</Text>
              <Text style={styles.orbitName}>{habit.name}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <PrimaryButton
        label="Continue"
        disabled={busy || habits.length === 0}
        onPress={onContinue}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[3] },
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
  },
  easyList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space[2],
  },
  easyChip: {
    backgroundColor: colors.accentSoft,
    color: colors.accent,
    overflow: "hidden",
    paddingHorizontal: space[3],
    paddingVertical: space[1],
    borderRadius: radius.full,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.ink,
    marginTop: space[2],
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
  orbitList: { gap: space[2], marginTop: space[2] },
  orbitRow: {
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
  orbitGlyph: { fontSize: fontSize.lg, width: 28, textAlign: "center" },
  orbitName: { fontSize: fontSize.md, fontWeight: "600", color: colors.ink },
});
