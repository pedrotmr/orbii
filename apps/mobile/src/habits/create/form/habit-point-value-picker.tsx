import { type Palette, radius, space } from "@orbii/tokens";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useTheme, useThemedStyles } from "../../../theme/use-theme";

const presetValues = [
  { label: "Easy", value: 10 },
  { label: "Medium", value: 20 },
  { label: "Hard", value: 30 },
];

interface HabitPointValuePickerProps {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

export default function HabitPointValuePicker({
  value,
  disabled,
  onChange,
}: HabitPointValuePickerProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const customValue = presetValues.some(
    (preset) => String(preset.value) === value,
  )
    ? ""
    : value;
  const pointValue = Number(value);
  const isValid = /^\d+$/.test(value) && pointValue >= 1 && pointValue <= 100;

  return (
    <View style={styles.wrap}>
      <View style={styles.heading}>
        <Text style={styles.label}>Points</Text>
        <Text style={styles.caption}>Choose what this habit is worth.</Text>
      </View>
      <View accessibilityRole="radiogroup" style={styles.presets}>
        {presetValues.map((preset) => {
          const checked = value === String(preset.value);
          return (
            <Pressable
              key={preset.label}
              accessibilityRole="radio"
              accessibilityLabel={`${preset.label} ${preset.value}`}
              accessibilityState={{ checked, disabled }}
              disabled={disabled}
              onPress={() => onChange(String(preset.value))}
              style={[styles.preset, checked && styles.selected]}
            >
              <Text
                style={[styles.presetLabel, checked && styles.selectedText]}
              >
                {preset.label}
              </Text>
              <Text
                style={[styles.presetValue, checked && styles.selectedText]}
              >
                {preset.value}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.customField}>
        <Text style={styles.customLabel}>Custom point value</Text>
        <TextInput
          accessibilityLabel="Custom point value"
          accessibilityHint="Enter a whole number from 1 to 100"
          value={customValue}
          placeholder="1–100"
          placeholderTextColor={colors.muted}
          keyboardType="number-pad"
          editable={!disabled}
          maxLength={3}
          onChangeText={onChange}
          style={styles.input}
          selectionColor={colors.primary}
        />
      </View>
      <Text style={isValid ? styles.hint : styles.error}>
        {isValid
          ? "Use a whole number from 1 to 100."
          : "Enter a whole number from 1 to 100."}
      </Text>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: { gap: space[3] },
    heading: { gap: space[1] },
    label: { color: colors.ink, fontSize: 15, fontWeight: "600" },
    caption: { color: colors.muted, fontSize: 13 },
    presets: { flexDirection: "row", gap: space[2] },
    preset: {
      flex: 1,
      minHeight: 58,
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
    },
    selected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    presetLabel: { color: colors.muted, fontSize: 12, fontWeight: "600" },
    presetValue: { color: colors.ink, fontSize: 16, fontWeight: "700" },
    selectedText: { color: colors.primary },
    customField: { gap: space[1] },
    customLabel: { color: colors.ink, fontSize: 13, fontWeight: "600" },
    input: {
      minHeight: 48,
      paddingHorizontal: space[3],
      backgroundColor: colors.bgMid,
      borderRadius: radius.md,
      color: colors.ink,
      fontSize: 16,
    },
    hint: { color: colors.muted, fontSize: 12 },
    error: { color: colors.danger, fontSize: 12 },
  });
