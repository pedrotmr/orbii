import { type HabitCategory } from "@orbii/backend";
import { type Palette, radius, space } from "@orbii/tokens";
import { CheckIcon } from "phosphor-react-native/src/icons/Check";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { selectionFeedback } from "../../../components/controls/feedback";
import { habitCategories } from "../../../components/habits/habit-symbol-catalog";
import { useTheme, useThemedStyles } from "../../../theme/use-theme";

interface HabitCategoryPickerProps {
  value: HabitCategory;
  disabled: boolean;
  onChange: (category: HabitCategory) => void;
}

export default function HabitCategoryPicker({
  value,
  disabled,
  onChange,
}: HabitCategoryPickerProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Category</Text>
      <View accessibilityRole="radiogroup" style={styles.options}>
        {habitCategories.map((category) => {
          const selected = category === value;
          return (
            <Pressable
              key={category}
              accessibilityRole="radio"
              accessibilityLabel={category}
              accessibilityState={{ checked: selected, disabled }}
              disabled={disabled}
              onPress={() => {
                selectionFeedback();
                onChange(category);
              }}
              style={({ pressed }) => [
                styles.option,
                selected && styles.selected,
                pressed && styles.pressed,
              ]}
            >
              {selected ? (
                <CheckIcon size={16} weight="bold" color={colors.primary} />
              ) : null}
              <Text style={[styles.text, selected && styles.selectedText]}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: { gap: space[3] },
    label: { color: colors.ink, fontSize: 15, fontWeight: "600" },
    options: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
    option: {
      flexDirection: "row",
      gap: space[1],
      alignItems: "center",
      justifyContent: "center",
      minHeight: 48,
      paddingHorizontal: space[4],
      borderRadius: radius.full,
      backgroundColor: colors.bgMid,
    },
    selected: { backgroundColor: colors.primarySoft },
    pressed: { opacity: 0.7 },
    text: { color: colors.muted, fontSize: 15, fontWeight: "500" },
    selectedText: { color: colors.primary },
  });
