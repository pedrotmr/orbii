import { type Palette, radius, space } from "@orbii/tokens";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { type ThemePreference, useThemedStyles } from "../../theme/use-theme";

interface SettingsThemeSectionProps {
  preference: ThemePreference;
  busy: boolean;
  onChange: (preference: ThemePreference) => void;
}

interface ThemeOption {
  label: string;
  value: ThemePreference;
}

const options: ThemeOption[] = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

export default function SettingsThemeSection({
  preference,
  busy,
  onChange,
}: SettingsThemeSectionProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.wrap}>
      <Text style={styles.section}>Appearance</Text>
      <View style={styles.card}>
        <Text style={styles.label}>App theme</Text>
        <View style={styles.options}>
          {options.map((option) => {
            const selected = preference === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityLabel={option.label}
                accessibilityState={{ checked: selected, disabled: busy }}
                disabled={busy}
                onPress={() => onChange(option.value)}
                style={({ pressed }) => [
                  styles.option,
                  selected && styles.selectedOption,
                  pressed && !busy && styles.pressed,
                ]}
              >
                <Text
                  style={[styles.optionLabel, selected && styles.selectedLabel]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.hint}>
          Follow your device setting or choose a theme for Orbii.
        </Text>
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: { gap: space[3] },
    section: {
      color: colors.muted,
      fontSize: 14,
      fontWeight: "500",
      paddingHorizontal: space[4],
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      gap: space[3],
      padding: space[5],
    },
    label: { color: colors.ink, fontSize: 16, fontWeight: "500" },
    options: {
      flexDirection: "row",
      gap: space[2],
      padding: space[1],
      backgroundColor: colors.bgMid,
      borderRadius: radius.md,
    },
    option: {
      flex: 1,
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.bgMid,
    },
    selectedOption: {
      backgroundColor: colors.surface,
      borderColor: colors.line,
    },
    pressed: { backgroundColor: colors.primarySoft },
    optionLabel: { color: colors.muted, fontSize: 14, fontWeight: "500" },
    selectedLabel: { color: colors.ink, fontWeight: "600" },
    hint: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  });
