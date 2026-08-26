import { colors, fonts, fontSize, space } from "@orbii/tokens";
import { Pressable, StyleSheet, Text } from "react-native";

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

const styles = StyleSheet.create({
  ghostBtn: { paddingVertical: space[3], alignItems: "center" },
  ghostBtnDisabled: { opacity: 0.4 },
  ghostBtnText: {
    fontFamily: fonts.semiBold,
    color: colors.muted,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  ghostBtnTextDisabled: {
    color: colors.line,
  },
});
