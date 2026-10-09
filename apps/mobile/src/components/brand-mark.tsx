import { brandColors, fontSize, space } from "@orbii/tokens";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/use-theme";
import ReturnLoopMark from "./brand-mark/return-loop-mark";

interface BrandMarkProps {
  /** Slightly larger brand for welcome/auth. */
  large?: boolean;
}

export default function BrandMark({ large }: BrandMarkProps) {
  const { scheme } = useTheme();
  const wordColor = scheme === "dark" ? brandColors.fog : brandColors.pine;
  return (
    <View
      accessible
      accessibilityRole="header"
      accessibilityLabel="Orbii"
      style={styles.row}
    >
      <ReturnLoopMark size={large ? 40 : 28} />
      <Text
        style={[styles.word, { color: wordColor }, large && styles.wordLarge]}
      >
        Orb<Text style={styles.highlight}>ii</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[2],
  },
  highlight: { color: brandColors.coral },
  word: {
    fontWeight: "700",
    fontSize: fontSize.lg,
    letterSpacing: -0.3,
  },
  wordLarge: {
    fontSize: fontSize.xl,
    letterSpacing: -0.4,
  },
});
