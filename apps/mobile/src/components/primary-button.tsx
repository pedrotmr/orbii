import { colors, fontSize, radius, space } from "@orbii/tokens";
import { Pressable, StyleSheet, Text } from "react-native";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export default function PrimaryButton({
  label,
  onPress,
  disabled,
}: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryBtn,
        disabled && styles.primaryBtnDisabled,
        pressed && !disabled && { opacity: 0.9 },
      ]}
    >
      <Text style={styles.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primaryBtn: {
    marginTop: space[2],
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: space[4],
    alignItems: "center",
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: {
    color: colors.onPrimary,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
});
