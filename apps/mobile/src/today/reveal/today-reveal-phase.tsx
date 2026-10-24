import { type Palette, space } from "@orbii/tokens";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, ReduceMotion } from "react-native-reanimated";
import type { TodayHabit } from "../today-habit";
import { selectionFeedback } from "../../components/controls/feedback";
import PrimaryButton from "../../components/primary-button";
import { useThemedStyles } from "../../theme/use-theme";
import TodayOfferRow from "./today-offer-row";

interface TodayRevealPhaseProps {
  usualCount: number;
  selectedIds: string[];
  offeredHabits: TodayHabit[];
  releasedCount?: number | null;
  busy: boolean;
  onToggle: (habitId: string) => void;
  onCommit: () => void;
  onShuffle: () => void;
}

export default function TodayRevealPhase({
  usualCount,
  selectedIds,
  offeredHabits,
  releasedCount = null,
  busy,
  onToggle,
  onCommit,
  onShuffle,
}: TodayRevealPhaseProps) {
  const styles = useThemedStyles(createStyles);
  const count = selectedIds.length;
  const pickGuidance =
    offeredHabits.length === 1
      ? "Pick the habit"
      : "Pick 1–" + offeredHabits.length;
  return (
    <Animated.View
      entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)}
      style={styles.block}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Today</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Choose your focus.
        </Text>
        <Text style={styles.sub}>
          {pickGuidance}; your usual {usualCount} is just a guide.
        </Text>
      </View>

      {releasedCount !== null ? (
        <Text style={styles.releaseNote}>
          Your earlier {releasedCount}-habit Orbit was released. Choose again
          from this fresh offer.
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Refresh the offer"
        accessibilityState={{ disabled: busy }}
        disabled={busy}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        onPress={() => {
          selectionFeedback();
          onShuffle();
        }}
        style={({ pressed }) => [
          styles.refresh,
          busy && styles.refreshDisabled,
          pressed && !busy && styles.refreshPressed,
        ]}
      >
        <Text style={styles.refreshLabel}>Refresh the offer →</Text>
      </Pressable>

      <View style={styles.list}>
        {offeredHabits.map((habit) => (
          <TodayOfferRow
            key={habit.id}
            habit={habit}
            selected={selectedIds.includes(habit.id)}
            disabled={busy}
            onToggle={() => onToggle(habit.id)}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.selection} accessibilityLiveRegion="polite">
          {count} picked · your count sets today’s capacity
        </Text>
        <PrimaryButton
          label="Commit today’s Orbit"
          disabled={busy || count === 0}
          onPress={onCommit}
        />
      </View>
    </Animated.View>
  );
}
const createStyles = (colors: Palette) =>
  StyleSheet.create({
    block: { gap: space[3], flexGrow: 1 },
    header: {
      gap: space[1],
    },
    eyebrow: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "600",
      letterSpacing: 0.2,
    },
    title: {
      fontSize: 29,
      lineHeight: 34,
      fontWeight: "700",
      color: colors.ink,
      letterSpacing: -0.9,
    },
    sub: { fontSize: 14, lineHeight: 20, color: colors.muted },
    releaseNote: {
      paddingHorizontal: space[3],
      paddingVertical: space[2],
      borderRadius: 12,
      backgroundColor: colors.primarySoft,
      color: colors.ink,
      fontSize: 13,
      lineHeight: 19,
    },
    refresh: {
      alignSelf: "flex-start",
      minHeight: 32,
      justifyContent: "center",
      paddingVertical: 4,
    },
    refreshDisabled: { opacity: 0.4 },
    refreshPressed: { opacity: 0.75 },
    refreshLabel: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: "600",
    },
    list: { gap: space[2] },
    footer: { gap: space[2], marginTop: "auto", paddingTop: space[2] },
    selection: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
      textAlign: "center",
    },
  });
