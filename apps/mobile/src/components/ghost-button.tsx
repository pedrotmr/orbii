import type { Palette } from "@orbii/tokens";
import { fontSize, space } from "@orbii/tokens";
import { Pressable, StyleSheet, Text } from "react-native";
import { useThemedStyles } from "../theme/use-theme";

interface GhostButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export default function GhostButton({
  label,
  onPress,
  disabled,
}: GhostButtonProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled ?? false }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.ghostBtn,
        disabled && styles.ghostBtnDisabled,
        pressed && !disabled && { opacity: 0.9 },
      ]}
    >
      <Text
        style={[styles.ghostBtnText, disabled && styles.ghostBtnTextDisabled]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    ghostBtn: {
      minHeight: 48,
      paddingVertical: space[3],
      alignItems: "center",
      justifyContent: "center",
    },
    ghostBtnDisabled: { opacity: 0.4 },
    ghostBtnText: {
      fontWeight: "600",
      color: colors.muted,
      fontSize: fontSize.sm,
    },
    ghostBtnTextDisabled: {
      color: colors.muted,
    },
  });
