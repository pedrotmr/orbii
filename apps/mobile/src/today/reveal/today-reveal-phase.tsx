import { type Palette, space } from "@orbii/tokens";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, ReduceMotion } from "react-native-reanimated";
import type { TodayHabit } from "../today-habit";
import GhostButton from "../../components/ghost-button";
import PrimaryButton from "../../components/primary-button";
import { useThemedStyles } from "../../theme/use-theme";
import TodayOfferRow from "./today-offer-row";

interface TodayRevealPhaseProps {
  capacity: number;
  selectedIds: string[];
  offeredHabits: TodayHabit[];
  busy: boolean;
  onToggle: (habitId: string) => void;
  onCommit: () => void;
  onShuffle: () => void;
}

export default function TodayRevealPhase({
  capacity,
  selectedIds,
  offeredHabits,
  busy,
  onToggle,
  onCommit,
  onShuffle,
}: TodayRevealPhaseProps) {
  const styles = useThemedStyles(createStyles);
  const count = selectedIds.length;
  return (
    <Animated.View
      entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)}
      style={styles.block}
    >
      <Text accessibilityRole="header" style={styles.title}>
        What fits today?
      </Text>
      <Text style={styles.sub}>
        Choose up to {capacity}. Even one is a good place to start.
      </Text>
      <View style={styles.selection} accessibilityLiveRegion="polite">
        <Text style={styles.selectionText}>
          {count === 0 ? "Your options" : `${count} selected`}
        </Text>
        <Text style={styles.limit}>Up to {capacity}</Text>
      </View>
      <View style={styles.list}>
        {offeredHabits.map((habit) => (
          <TodayOfferRow
            key={habit.id}
            habit={habit}
            selected={selectedIds.includes(habit.id)}
            disabled={
              busy || (count >= capacity && !selectedIds.includes(habit.id))
            }
            onToggle={() => onToggle(habit.id)}
          />
        ))}
      </View>
      <View style={styles.actions}>
        <PrimaryButton
          label={
            count > 0
              ? `Start with ${count} ${count === 1 ? "habit" : "habits"}`
              : "Choose your focus"
          }
          disabled={busy || count === 0}
          onPress={onCommit}
        />
        <GhostButton
          label="Try other options"
          disabled={busy}
          onPress={onShuffle}
        />
      </View>
    </Animated.View>
  );
}
const createStyles = (colors: Palette) =>
  StyleSheet.create({
    block: { gap: space[3], flexGrow: 1 },
    title: {
      fontSize: 32,
      lineHeight: 38,
      fontWeight: "700",
      color: colors.ink,
      letterSpacing: -0.8,
    },
    sub: { fontSize: 16, lineHeight: 24, color: colors.muted },
    selection: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
      marginTop: space[4],
      marginBottom: space[1],
    },
    selectionText: { fontSize: 14, fontWeight: "600", color: colors.ink },
    limit: { fontSize: 14, color: colors.muted },
    list: { gap: space[2] },
    actions: { gap: space[1], paddingTop: space[4], marginTop: "auto" },
  });
