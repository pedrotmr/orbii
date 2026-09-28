import Ionicons from "@expo/vector-icons/Ionicons";
import { type Palette, radius, space } from "@orbii/tokens";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme, useThemedStyles } from "../../theme/use-theme";

interface OrbitLiveActivityRestoreButtonProps {
  busy: boolean;
  disabled: boolean;
  onPress: () => void;
  subtitle: string;
}

export default function OrbitLiveActivityRestoreButton({
  busy,
  disabled,
  onPress,
  subtitle,
}: OrbitLiveActivityRestoreButtonProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Show today’s Orbit on the Lock Screen"
      accessibilityState={{ disabled: busy || disabled }}
      disabled={busy || disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        (busy || disabled) && styles.disabled,
        pressed && !busy && !disabled && styles.pressed,
      ]}
    >
      <View style={styles.icon}>
        <Ionicons
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          name="lock-closed-outline"
          size={18}
          color={colors.primary}
        />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>Show today’s Orbit on Lock Screen</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Ionicons
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        name="chevron-forward"
        size={18}
        color={colors.muted}
      />
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    button: {
      minHeight: 72,
      flexDirection: "row",
      alignItems: "center",
      gap: space[3],
      paddingHorizontal: space[4],
      paddingVertical: space[3],
      borderRadius: radius.lg,
      backgroundColor: colors.primarySoft,
    },
    icon: {
      width: 38,
      height: 38,
      borderRadius: radius.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
    },
    copy: { flex: 1, gap: space[1] },
    title: { color: colors.ink, fontSize: 15, fontWeight: "600" },
    subtitle: { color: colors.muted, fontSize: 13, lineHeight: 18 },
    disabled: { opacity: 0.5 },
    pressed: { opacity: 0.8 },
  });
