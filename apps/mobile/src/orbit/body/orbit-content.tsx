import Ionicons from "@expo/vector-icons/Ionicons";
import { type Habit } from "@orbii/backend";
import { type Palette, radius, space } from "@orbii/tokens";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ScreenScaffold from "../../components/layout/screen-scaffold";
import InlineError from "../../components/states/inline-error";
import { useTheme, useThemedStyles } from "../../theme/use-theme";
import OrbitHabitList from "../list/orbit-habit-list";

interface OrbitContentProps {
  habits: Habit[];
  busy: boolean;
  error: string | null;
  onRemove: (id: string) => void;
}

export default function OrbitContent({
  habits,
  busy,
  error,
  onRemove,
}: OrbitContentProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  return (
    <ScreenScaffold tabbed>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>
          Your Orbit
        </Text>
        <Text style={styles.sub}>
          Good things to keep in your life. A few at a time.
        </Text>
      </View>
      <View style={styles.summary}>
        <Text style={styles.count}>
          {habits.length} {habits.length === 1 ? "habit" : "habits"}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add habit"
          accessibilityState={{ disabled: busy }}
          disabled={busy}
          onPress={() => router.push("/habit-create")}
          style={({ pressed }) => [styles.add, pressed && styles.pressed]}
        >
          <Ionicons
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            name="add"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.addLabel}>Add habit</Text>
        </Pressable>
      </View>
      {error ? <InlineError message={error} /> : null}
      <OrbitHabitList habits={habits} busy={busy} onRemove={onRemove} />
      <Text style={styles.note}>
        They all belong here. They don’t all belong on today’s list.
      </Text>
    </ScreenScaffold>
  );
}
const createStyles = (colors: Palette) =>
  StyleSheet.create({
    heading: { gap: space[2] },
    title: {
      fontSize: 34,
      lineHeight: 40,
      fontWeight: "700",
      color: colors.ink,
      letterSpacing: -1,
    },
    sub: { color: colors.muted, fontSize: 16, lineHeight: 24 },
    summary: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: space[3],
      marginBottom: -space[3],
    },
    count: { fontSize: 14, color: colors.muted, fontWeight: "500" },
    add: {
      minHeight: 48,
      paddingHorizontal: space[3],
      borderRadius: radius.full,
      alignItems: "center",
      flexDirection: "row",
      gap: space[1],
    },
    pressed: { backgroundColor: colors.primarySoft },
    addLabel: { color: colors.primary, fontSize: 15, fontWeight: "600" },
    note: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 22,
      paddingHorizontal: space[2],
    },
  });
