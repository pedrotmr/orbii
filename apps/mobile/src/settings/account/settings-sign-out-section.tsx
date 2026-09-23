import Ionicons from "@expo/vector-icons/Ionicons";
import { type Palette, radius, space } from "@orbii/tokens";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme, useThemedStyles } from "../../theme/use-theme";

interface SettingsSignOutSectionProps {
  busy: boolean;
  onSignOut: () => void;
}

export default function SettingsSignOutSection({
  busy,
  onSignOut,
}: SettingsSignOutSectionProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.wrap}>
      <Text style={styles.section}>Account</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        accessibilityState={{ disabled: busy }}
        disabled={busy}
        onPress={() =>
          Alert.alert(
            "Sign out of Orbii?",
            "Your habits and progress will be here when you sign back in.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Sign out", style: "destructive", onPress: onSignOut },
            ],
          )
        }
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <Ionicons
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          name="log-out-outline"
          size={23}
          color={colors.primaryDeep}
        />
        <Text style={styles.label}>Sign out</Text>
        <Ionicons
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          name="chevron-forward"
          size={18}
          color={colors.muted}
        />
      </Pressable>
      <Text style={styles.hint}>Your Orbit is saved to your account.</Text>
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
    row: {
      flexDirection: "row",
      gap: space[4],
      alignItems: "center",
      padding: space[5],
      minHeight: 64,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
    },
    label: {
      flex: 1,
      color: colors.primaryDeep,
      fontSize: 16,
      fontWeight: "500",
    },
    hint: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 21,
      paddingHorizontal: space[4],
    },
    pressed: { backgroundColor: colors.bgMid },
  });
