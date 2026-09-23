import type { Palette } from "@orbii/tokens";
import { fontSize, radius, space } from "@orbii/tokens";
import { StyleSheet, Text, View } from "react-native";
import { useThemedStyles } from "../theme/use-theme";

interface BrandMarkProps {
  /** Slightly larger brand for welcome/auth. */
  large?: boolean;
}

export default function BrandMark({ large }: BrandMarkProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View
      accessible
      accessibilityRole="header"
      accessibilityLabel="Orbii"
      style={styles.row}
    >
      <View style={[styles.orb, large && styles.orbLarge]} />
      <Text style={[styles.word, large && styles.wordLarge]}>Orbii</Text>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[2],
    },
    orb: {
      width: 12,
      height: 12,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
    },
    orbLarge: {
      width: 16,
      height: 16,
    },
    word: {
      fontWeight: "700",
      fontSize: fontSize.lg,
      color: colors.ink,
      letterSpacing: -0.3,
    },
    wordLarge: {
      fontSize: fontSize.xl,
      letterSpacing: -0.4,
    },
  });
