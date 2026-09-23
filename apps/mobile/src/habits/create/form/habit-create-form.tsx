import { type HabitCategory } from "@orbii/backend";
import { type Palette, radius, space } from "@orbii/tokens";
import { PencilSimpleIcon } from "phosphor-react-native/src/icons/PencilSimple";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import HabitIcon from "../../../components/habits/habit-icon";
import {
  type HabitSymbol,
  symbolGlyph,
} from "../../../components/habits/habit-symbol-catalog";
import { useTheme, useThemedStyles } from "../../../theme/use-theme";
import HabitCategoryPicker from "./habit-category-picker";

interface HabitCreateFormProps {
  name: string;
  symbol: HabitSymbol;
  category: HabitCategory;
  busy: boolean;
  onNameChange: (name: string) => void;
  onCategoryChange: (category: HabitCategory) => void;
  onChooseIcon: () => void;
  onSubmit: () => void;
}

export default function HabitCreateForm({
  name,
  symbol,
  category,
  busy,
  onNameChange,
  onCategoryChange,
  onChooseIcon,
  onSubmit,
}: HabitCreateFormProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      <Text style={styles.intro}>Something you want to make room for.</Text>
      <View style={styles.identity}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Change icon, ${symbol.label}`}
          accessibilityHint="Choose from the symbol collection"
          accessibilityState={{ disabled: busy }}
          disabled={busy}
          onPress={onChooseIcon}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.pressed,
          ]}
        >
          <HabitIcon glyph={symbolGlyph(symbol.id)} size={88} />
          <View style={styles.editBadge}>
            <PencilSimpleIcon size={16} color={colors.ink} />
          </View>
          <Text style={styles.changeLabel}>Change icon</Text>
        </Pressable>
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Habit name</Text>
        <TextInput
          accessibilityLabel="Habit name"
          placeholder="e.g. Take an evening walk"
          placeholderTextColor={colors.muted}
          value={name}
          onChangeText={onNameChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, focused && styles.focused]}
          editable={!busy}
          onSubmitEditing={onSubmit}
          returnKeyType="done"
          maxLength={50}
          selectionColor={colors.primary}
          autoCapitalize="sentences"
        />
      </View>
      <HabitCategoryPicker
        value={category}
        disabled={busy}
        onChange={onCategoryChange}
      />
      <Text style={styles.note}>
        It belongs in your Orbit. It doesn’t have to happen every day.
      </Text>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: { gap: space[6] },
    intro: { color: colors.muted, fontSize: 16, lineHeight: 24 },
    identity: { alignItems: "center", paddingVertical: space[2] },
    iconButton: { alignItems: "center", gap: space[2] },
    editBadge: {
      position: "absolute",
      top: 60,
      right: 0,
      padding: space[2],
      borderRadius: radius.full,
      backgroundColor: colors.bgMid,
    },
    changeLabel: { color: colors.primary, fontSize: 14, fontWeight: "500" },
    pressed: { opacity: 0.7 },
    field: { gap: space[2] },
    label: { fontSize: 15, fontWeight: "600", color: colors.ink },
    input: {
      minHeight: 56,
      paddingHorizontal: space[4],
      paddingVertical: space[3],
      backgroundColor: colors.bgMid,
      borderWidth: 1,
      borderColor: colors.bgMid,
      borderRadius: radius.md,
      color: colors.ink,
      fontSize: 18,
    },
    focused: { borderColor: colors.primary },
    note: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  });
