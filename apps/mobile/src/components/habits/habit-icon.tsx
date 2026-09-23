import { radius, type Palette } from "@orbii/tokens";
import { StyleSheet, Text, View } from "react-native";
import { useTheme, useThemedStyles } from "../../theme/use-theme";
import HabitSymbolArt from "./habit-symbol-art";
import { defaultHabitSymbol, findHabitSymbol } from "./habit-symbol-catalog";

interface HabitIconProps {
  glyph: string;
  selected?: boolean;
  size?: number;
}

export default function HabitIcon({
  glyph,
  selected,
  size = 44,
}: HabitIconProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const symbol = findHabitSymbol(glyph);
  const fallback = !glyph.trim() || glyph.startsWith("symbol:");
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.wrap,
        symbol?.category === "body" || symbol?.category === "learn"
          ? styles.warm
          : styles.earthy,
        { width: size, height: size },
        selected && styles.selected,
      ]}
    >
      {symbol || fallback ? (
        <HabitSymbolArt
          symbol={symbol ?? defaultHabitSymbol}
          size={size * 0.6}
          colors={colors}
        />
      ) : (
        <Text style={styles.glyph} numberOfLines={1}>
          {glyph}
        </Text>
      )}
    </View>
  );
}
const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.bgMid,
      borderRadius: radius.full,
    },
    selected: { backgroundColor: colors.primarySoft },
    warm: { backgroundColor: colors.primarySoft },
    earthy: { backgroundColor: colors.accentSoft },
    glyph: { color: colors.ink, fontSize: 22 },
  });
