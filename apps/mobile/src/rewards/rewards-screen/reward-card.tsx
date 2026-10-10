import Ionicons from "@expo/vector-icons/Ionicons";
import { type Palette, radius, space } from "@orbii/tokens";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ActiveReward } from "../rewards-types";
import { useTheme, useThemedStyles } from "../../theme/use-theme";

interface RewardCardProps {
  reward: ActiveReward;
  busy: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export default function RewardCard({
  reward,
  busy,
  onEdit,
  onDelete,
}: RewardCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const progressPercent =
    reward.cost > 0
      ? Math.min(100, Math.round((reward.pointsProgress / reward.cost) * 100))
      : 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.gift}>
          <Ionicons name="gift-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.title}>
          <Text style={styles.name}>{reward.name}</Text>
          <Text style={styles.cost}>{reward.cost.toLocaleString()} pts</Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={"Edit " + reward.name}
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            onPress={onEdit}
            style={({ pressed }) => [
              styles.action,
              pressed && !busy && styles.pressed,
            ]}
          >
            <Ionicons name="create-outline" size={20} color={colors.muted} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={"Delete " + reward.name}
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            onPress={onDelete}
            style={({ pressed }) => [
              styles.action,
              pressed && !busy && styles.pressed,
            ]}
          >
            <Ionicons name="trash-outline" size={19} color={colors.muted} />
          </Pressable>
        </View>
      </View>
      <View style={styles.progressCopy}>
        <Text style={styles.progressLabel}>
          {reward.pointsProgress.toLocaleString()} /{" "}
          {reward.cost.toLocaleString()} pts
        </Text>
        <Text style={reward.isEligible ? styles.ready : styles.remaining}>
          {reward.isEligible
            ? "Enough points for this goal"
            : reward.pointsRemaining.toLocaleString() + " pts to go"}
        </Text>
      </View>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={reward.name + " progress"}
        accessibilityValue={{ min: 0, max: 100, now: progressPercent }}
        style={styles.track}
      >
        <View style={[styles.fill, { width: String(progressPercent) + "%" }]} />
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      gap: space[4],
      padding: space[4],
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
    },
    header: { flexDirection: "row", alignItems: "center", gap: space[3] },
    gift: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.md,
      backgroundColor: colors.primarySoft,
    },
    title: { flex: 1, gap: space[1] },
    name: { color: colors.ink, fontSize: 16, fontWeight: "600" },
    cost: { color: colors.muted, fontSize: 14 },
    actions: { flexDirection: "row", gap: space[1] },
    action: {
      width: 42,
      height: 42,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.full,
    },
    pressed: { backgroundColor: colors.bgMid },
    progressCopy: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: space[2],
    },
    progressLabel: { color: colors.ink, fontSize: 14, fontWeight: "600" },
    ready: { color: colors.success, fontSize: 12, fontWeight: "600" },
    remaining: { color: colors.muted, fontSize: 12, fontWeight: "500" },
    track: {
      height: 9,
      overflow: "hidden",
      borderRadius: radius.full,
      backgroundColor: colors.track,
    },
    fill: {
      height: "100%",
      borderRadius: radius.full,
      backgroundColor: colors.primary,
    },
  });
