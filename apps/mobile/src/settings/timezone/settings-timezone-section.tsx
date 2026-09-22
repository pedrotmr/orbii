import Ionicons from "@expo/vector-icons/Ionicons";
import { type Palette, radius, space } from "@orbii/tokens";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import GhostButton from "../../components/ghost-button";
import PrimaryButton from "../../components/primary-button";
import { useTheme, useThemedStyles } from "../../theme/use-theme";

interface SettingsTimezoneSectionProps {
  timezone: string;
  deviceTimezone: string;
  busy: boolean;
  onSave: (timezone: string) => Promise<boolean>;
}

export default function SettingsTimezoneSection({
  timezone,
  deviceTimezone,
  busy,
  onSave,
}: SettingsTimezoneSectionProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(timezone);
  const dirty = draft.trim() !== timezone;
  const save = async (value: string) => {
    if (busy) {
      return;
    }
    const ok = await onSave(value.trim());
    if (ok) {
      setDraft(value.trim());
      setEditing(false);
    }
  };
  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Timezone, ${timezone}. Change timezone`}
        accessibilityState={{ expanded: editing, disabled: busy }}
        disabled={busy}
        onPress={() => setEditing(!editing)}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <Ionicons
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          name="globe-outline"
          size={23}
          color={colors.muted}
        />
        <View style={styles.meta}>
          <Text style={styles.label}>Timezone</Text>
          <Text style={styles.value}>{timezone.replaceAll("_", " ")}</Text>
        </View>
        <Ionicons
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          name={editing ? "chevron-up" : "chevron-forward"}
          size={18}
          color={colors.muted}
        />
      </Pressable>
      <Text style={styles.hint}>
        Your day starts and ends at midnight here.
      </Text>
      {editing ? (
        <View style={styles.editor}>
          <Text style={styles.label}>Timezone name</Text>
          <TextInput
            accessibilityLabel="Timezone name"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!busy}
            maxLength={64}
            onChangeText={setDraft}
            placeholder="America/Sao_Paulo"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={draft}
            selectionColor={colors.primary}
            returnKeyType="done"
            onSubmitEditing={() => {
              if (dirty && draft.trim()) {
                void save(draft);
              }
            }}
          />
          <Text style={styles.hint}>
            Use a region/city name, such as America/Sao_Paulo.
          </Text>
          <PrimaryButton
            label="Save timezone"
            disabled={busy || !dirty || !draft.trim()}
            onPress={() => void save(draft)}
          />
          <GhostButton
            label="Use device timezone"
            disabled={busy || deviceTimezone === timezone}
            onPress={() => void save(deviceTimezone)}
          />
        </View>
      ) : null}
    </View>
  );
}
const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: { gap: space[3] },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[4],
      padding: space[5],
      minHeight: 82,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
    },
    pressed: { backgroundColor: colors.bgMid },
    meta: { flex: 1, gap: space[1] },
    label: { fontSize: 16, fontWeight: "500", color: colors.ink },
    value: { fontSize: 14, color: colors.muted, lineHeight: 20 },
    hint: {
      fontSize: 14,
      color: colors.muted,
      lineHeight: 21,
      paddingHorizontal: space[4],
    },
    editor: { gap: space[3] },
    input: {
      minHeight: 52,
      padding: space[4],
      fontSize: 16,
      color: colors.ink,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.line,
    },
  });
