import { colors, fontSize, radius, space } from "@orbii/tokens";
import { StyleSheet, Text, View } from "react-native";
import type { TodayHabit } from "../today-habit";
import GhostButton from "../../components/ghost-button";
import PrimaryButton from "../../components/primary-button";
import { todayHabitStyles } from "../today-habit-styles";
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
  const selectedCount = selectedIds.length;
  const atCap = selectedCount >= capacity;
  const commitLabel =
    selectedCount > 0 ? `Start today · ${selectedCount}` : "Start today";

  return (
    <View style={styles.block}>
      <Text style={styles.eyebrow}>Today’s offer</Text>
      <Text style={styles.title}>What can you take on?</Text>
      <Text style={styles.sub}>
        Pick up to {capacity}. Low energy — just don’t choose what won’t work
        today.
      </Text>
      <Text style={styles.chip}>
        {selectedCount}/{capacity}
      </Text>
      <View style={todayHabitStyles.list}>
        {offeredHabits.map((habit) => {
          const selected = selectedIds.includes(habit.id);
          const disabled = busy || (atCap && !selected);
          return (
            <TodayOfferRow
              key={habit.id}
              habit={habit}
              selected={selected}
              disabled={disabled}
              onToggle={() => onToggle(habit.id)}
            />
          );
        })}
      </View>
      <PrimaryButton
        label={commitLabel}
        disabled={busy || selectedCount === 0}
        onPress={onCommit}
      />
      <GhostButton label="Shuffle offer" disabled={busy} onPress={onShuffle} />
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: space[3] },
  eyebrow: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: fontSize["2xl"],
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.6,
  },
  sub: {
    fontSize: fontSize.md,
    color: colors.muted,
    lineHeight: 22,
  },
  chip: {
    alignSelf: "flex-start",
    backgroundColor: colors.primarySoft,
    color: colors.primaryDeep,
    overflow: "hidden",
    paddingHorizontal: space[3],
    paddingVertical: space[1],
    borderRadius: radius.full,
    fontWeight: "700",
    fontSize: fontSize.sm,
  },
});
