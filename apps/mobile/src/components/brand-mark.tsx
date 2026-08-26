import { colors, fonts, fontSize, space } from "@orbii/tokens";
import { StyleSheet, Text, View } from "react-native";

interface BrandMarkProps {
  /** Slightly larger brand for welcome/auth. */
  large?: boolean;
}

export default function BrandMark({ large }: BrandMarkProps) {
  return (
    <View style={styles.row} accessibilityRole="header">
      <View style={[styles.orb, large && styles.orbLarge]} />
      <Text style={[styles.word, large && styles.wordLarge]}>Orbii</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[2],
  },
  orb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  orbLarge: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  word: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  wordLarge: {
    fontSize: fontSize.xl,
    letterSpacing: -0.4,
  },
});
