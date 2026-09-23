import { type HabitCategory } from "@orbii/backend";
import { type Palette, radius, space } from "@orbii/tokens";
import { MagnifyingGlassIcon } from "phosphor-react-native/src/icons/MagnifyingGlass";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import {
  habitCategories,
  habitSymbols,
  searchHabitSymbols,
  type HabitSymbol,
} from "../../../components/habits/habit-symbol-catalog";
import { useTheme, useThemedStyles } from "../../../theme/use-theme";
import HabitSymbolOption from "./habit-symbol-option";

interface HabitSymbolPickerProps {
  selected: HabitSymbol;
  suggested: HabitSymbol | undefined;
  onSelect: (symbol: HabitSymbol) => void;
}

export default function HabitSymbolPicker({
  selected,
  suggested,
  onSelect,
}: HabitSymbolPickerProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { fontScale } = useWindowDimensions();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<HabitCategory | "all">("all");
  const [browsingAll, setBrowsingAll] = useState(false);
  const showingCollection =
    browsingAll || Boolean(query.trim()) || category !== "all";
  const [quickPicks] = useState(() =>
    [...(suggested ? [suggested] : []), selected, ...habitSymbols]
      .filter(
        (symbol, index, symbols) =>
          symbols.findIndex((item) => item.id === symbol.id) === index,
      )
      .slice(0, 6),
  );
  const symbols = showingCollection
    ? searchHabitSymbols(query, category)
    : quickPicks;
  const columns = fontScale > 1.3 ? 2 : 3;
  return (
    <View style={styles.wrap}>
      <View style={styles.search}>
        <MagnifyingGlassIcon size={21} color={colors.muted} />
        <TextInput
          accessibilityLabel="Search symbols"
          placeholder="Search symbols"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
          style={styles.searchInput}
          selectionColor={colors.primary}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        keyboardShouldPersistTaps="handled"
      >
        {(["all", ...habitCategories] as const).map((item) => (
          <Pressable
            key={item}
            accessibilityRole="button"
            accessibilityState={{ selected: category === item }}
            onPress={() => {
              setCategory(item);
              setBrowsingAll(true);
            }}
            style={[styles.filter, category === item && styles.activeFilter]}
          >
            <Text
              style={[
                styles.filterLabel,
                category === item && styles.activeLabel,
              ]}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {!showingCollection ? (
        <Text accessibilityRole="header" style={styles.suggestionText}>
          {suggested ? "Suggested for your habit" : "Start here"}
        </Text>
      ) : null}
      {symbols.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No symbols found</Text>
          <Text style={styles.emptyText}>
            Try “book”, “walk”, or browse the collection.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setQuery("");
              setCategory("all");
              setBrowsingAll(true);
            }}
            style={styles.reset}
          >
            <Text style={styles.suggestionAction}>Show all symbols</Text>
          </Pressable>
        </View>
      ) : (
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="Habit symbols"
          style={styles.grid}
        >
          {symbols.map((symbol) => (
            <View key={symbol.id} style={{ width: `${100 / columns}%` }}>
              <HabitSymbolOption
                symbol={symbol}
                selected={selected.id === symbol.id}
                onSelect={onSelect}
              />
            </View>
          ))}
        </View>
      )}
      {!showingCollection ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setBrowsingAll(true)}
          style={styles.browse}
        >
          <Text style={styles.suggestionAction}>
            Browse all {habitSymbols.length} symbols
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: { gap: space[3] },
    search: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[2],
      paddingHorizontal: space[3],
      backgroundColor: colors.bgMid,
      borderRadius: radius.md,
    },
    searchInput: {
      flex: 1,
      minHeight: 50,
      color: colors.ink,
      fontSize: 16,
      paddingVertical: space[3],
    },
    filters: { flexDirection: "row", gap: space[2] },
    filter: {
      minHeight: 44,
      justifyContent: "center",
      paddingHorizontal: space[4],
      borderRadius: radius.full,
      backgroundColor: colors.bgMid,
    },
    activeFilter: { backgroundColor: colors.primarySoft },
    filterLabel: { fontSize: 14, color: colors.muted, fontWeight: "500" },
    activeLabel: { color: colors.primary },
    browse: {
      alignItems: "center",
      justifyContent: "center",
      minHeight: 48,
      padding: space[3],
      borderRadius: radius.md,
      backgroundColor: colors.primarySoft,
    },
    suggestionText: { color: colors.muted, fontSize: 14 },
    suggestionAction: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: "600",
    },
    grid: { flexDirection: "row", flexWrap: "wrap" },
    empty: { alignItems: "center", paddingVertical: space[8], gap: space[3] },
    emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: "600" },
    emptyText: {
      color: colors.muted,
      fontSize: 15,
      lineHeight: 22,
      textAlign: "center",
    },
    reset: { minHeight: 48, justifyContent: "center" },
  });
