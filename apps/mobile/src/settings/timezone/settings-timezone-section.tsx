import { colors, fontSize, radius, space } from "@orbii/tokens";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import GhostButton from "../../components/ghost-button";
import PrimaryButton from "../../components/primary-button";

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
  const [draft, setDraft] = useState(timezone);
  const dirty = draft.trim() !== timezone;

  const handleSave = () => {
    if (busy || !dirty) {
      return;
    }

    void onSave(draft);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Timezone</Text>
      <Text style={styles.hint}>
        Used for local calendar days and streaks. IANA name, e.g.
        America/New_York.
      </Text>
      <TextInput
        accessibilityLabel="Timezone"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!busy}
        maxLength={64}
        onChangeText={setDraft}
        placeholder="UTC"
        placeholderTextColor={colors.muted}
        style={styles.input}
        value={draft}
      />
      <View style={styles.actions}>
        <PrimaryButton
          label="Save timezone"
          disabled={busy || !dirty || draft.trim().length === 0}
          onPress={handleSave}
        />
        <GhostButton
          label="Use device"
          disabled={busy || deviceTimezone === draft.trim()}
          onPress={() => {
            void (async () => {
              const success = await onSave(deviceTimezone);

              if (success) {
                setDraft(deviceTimezone);
              }
            })();
          }}
        />
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
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    fontSize: fontSize.md,
    color: colors.ink,
  },
  actions: { gap: space[2], marginTop: space[1] },
});
