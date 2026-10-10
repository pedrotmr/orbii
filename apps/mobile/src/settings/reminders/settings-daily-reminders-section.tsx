import Ionicons from "@expo/vector-icons/Ionicons";
import { type Palette, radius, space } from "@orbii/tokens";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import type {
  DailyReminderKind,
  DailyReminderPreferences,
} from "../../reminders/daily-reminder-schedule";
import { useTheme, useThemedStyles } from "../../theme/use-theme";

interface SettingsDailyRemindersSectionProps {
  preferences: DailyReminderPreferences;
  disabled: boolean;
  permissionMessage: string | null;
  onChange: (kind: DailyReminderKind, enabled: boolean) => void;
  onOpenSettings: () => void;
}

export default function SettingsDailyRemindersSection({
  preferences,
  disabled,
  permissionMessage,
  onChange,
  onOpenSettings,
}: SettingsDailyRemindersSectionProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.wrap}>
      <Text style={styles.section}>Daily reminders</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            name="sunny-outline"
            size={23}
            color={colors.primary}
          />
          <View style={styles.meta}>
            <Text style={styles.label}>Morning</Text>
            <Text style={styles.time}>8:00 AM</Text>
          </View>
          <Switch
            accessibilityLabel="Morning reminder"
            disabled={disabled}
            onValueChange={(enabled) => onChange("morning", enabled)}
            value={preferences.morning}
            trackColor={{ false: colors.line, true: colors.primary }}
            thumbColor={colors.surface}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Ionicons
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            name="moon-outline"
            size={23}
            color={colors.primary}
          />
          <View style={styles.meta}>
            <Text style={styles.label}>Evening</Text>
            <Text style={styles.time}>8:00 PM</Text>
          </View>
          <Switch
            accessibilityLabel="Evening reminder"
            disabled={disabled}
            onValueChange={(enabled) => onChange("evening", enabled)}
            value={preferences.evening}
            trackColor={{ false: colors.line, true: colors.primary }}
            thumbColor={colors.surface}
          />
        </View>
      </View>
      <Text style={styles.hint}>
        Times follow your saved timezone. Orbii refreshes reminders when you
        open the app.
      </Text>
      {permissionMessage ? (
        <View style={styles.permission}>
          <Text style={styles.permissionText}>{permissionMessage}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open system Settings"
            disabled={disabled}
            onPress={onOpenSettings}
          >
            <Text style={styles.permissionAction}>Open system Settings</Text>
          </Pressable>
        </View>
      ) : null}
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
      paddingHorizontal: space[5],
    },
    row: {
      minHeight: 68,
      flexDirection: "row",
      alignItems: "center",
      gap: space[4],
    },
    meta: { flex: 1, gap: space[1] },
    label: { color: colors.ink, fontSize: 16, fontWeight: "500" },
    time: { color: colors.muted, fontSize: 14 },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line },
    hint: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 21,
      paddingHorizontal: space[4],
    },
    permission: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      gap: space[2],
      padding: space[4],
    },
    permissionText: { color: colors.primaryDeep, fontSize: 14, lineHeight: 20 },
    permissionAction: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: "600",
    },
  });
