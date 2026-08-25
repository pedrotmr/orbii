import { colors, fontSize, space } from "@orbii/tokens";
import { Pressable, StyleSheet, Text } from "react-native";

interface GhostButtonProps {
  label: string;
  onPress: () => void;
}

export default function GhostButton({ label, onPress }: GhostButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.ghostBtn}
    >
      <Text style={styles.ghostBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ghostBtn: { paddingVertical: space[3], alignItems: "center" },
  ghostBtnText: {
    color: colors.muted,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
});
