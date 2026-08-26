import { colors, fontSize, space } from "@orbii/tokens";
import { StyleSheet, Text, View } from "react-native";
import GhostButton from "../../components/ghost-button";

interface SettingsSignOutSectionProps {
  busy: boolean;
  onSignOut: () => void;
}

export default function SettingsSignOutSection({
  busy,
  onSignOut,
}: SettingsSignOutSectionProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Account</Text>
      <Text style={styles.hint}>
        Sign out on this device. Your Orbit stays in the cloud.
      </Text>
      <GhostButton label="Sign out" disabled={busy} onPress={onSignOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[2], marginTop: space[4] },
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
});
