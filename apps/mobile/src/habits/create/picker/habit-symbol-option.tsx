import { type Palette, radius, space } from "@orbii/tokens";
import { CheckIcon } from "phosphor-react-native/src/icons/Check";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { selectionFeedback } from "../../../components/controls/feedback";
import HabitIcon from "../../../components/habits/habit-icon";
import {
  type HabitSymbol,
  symbolGlyph,
} from "../../../components/habits/habit-symbol-catalog";
import { useTheme, useThemedStyles } from "../../../theme/use-theme";

interface HabitSymbolOptionProps {
  symbol: HabitSymbol;
  selected: boolean;
  onSelect: (symbol: HabitSymbol) => void;
}

export default function HabitSymbolOption({
  symbol,
  selected,
  onSelect,
}: HabitSymbolOptionProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={symbol.label}
      accessibilityState={{ checked: selected }}
      onPress={() => {
        selectionFeedback();
        onSelect(symbol);
      }}
      style={({ pressed }) => [styles.option, pressed && styles.pressed]}
    >
      <View style={[styles.ring, selected && styles.selected]}>
        <HabitIcon glyph={symbolGlyph(symbol.id)} size={64} />
        {selected ? (
          <View style={styles.check}>
            <CheckIcon size={13} weight="bold" color={colors.onPrimary} />
          </View>
        ) : null}
      </View>
      <Text style={[styles.label, selected && styles.selectedLabel]}>
        {symbol.label}
      </Text>
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    option: {
      alignItems: "center",
      gap: space[2],
      paddingHorizontal: space[1],
      paddingVertical: space[3],
    },
    pressed: { opacity: 0.65 },
    ring: {
      padding: space[1],
      borderWidth: 2,
      borderColor: colors.surface,
      borderRadius: radius.full,
    },
    selected: { borderColor: colors.primary },
    check: {
      position: "absolute",
      top: -1,
      right: -1,
      width: 22,
      height: 22,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    label: {
      alignSelf: "stretch",
      color: colors.muted,
      fontSize: 14,
      textAlign: "center",
    },
    selectedLabel: { color: colors.ink, fontWeight: "600" },
  });
