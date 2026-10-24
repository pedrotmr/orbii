import Ionicons from "@expo/vector-icons/Ionicons";
import { type Palette, space } from "@orbii/tokens";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ActiveReward } from "../../rewards-types";
import GhostButton from "../../../components/ghost-button";
import { useTheme, useThemedStyles } from "../../../theme/use-theme";
import ActiveRewardRow from "./active-reward-row";

interface RewardsActiveListProps {
  rewards: ActiveReward[];
  canLoadMore: boolean;
  busy: boolean;
  onAdd: () => void;
  onEdit: (reward: ActiveReward) => void;
  onDelete: (reward: ActiveReward) => void;
  onRedeem: (reward: ActiveReward) => void;
  onLoadMore: () => void;
}

export default function RewardsActiveList({
  rewards,
  canLoadMore,
  busy,
  onAdd,
  onEdit,
  onDelete,
  onRedeem,
  onLoadMore,
}: RewardsActiveListProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View
          accessible
          accessibilityRole="header"
          accessibilityLabel="Active"
          style={styles.heading}
        >
          <Text style={styles.label}>Active</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add reward"
          accessibilityState={{ disabled: busy }}
          disabled={busy}
          onPress={onAdd}
          style={({ pressed }) => [
            styles.add,
            busy && styles.disabled,
            pressed && !busy && styles.addPressed,
          ]}
        >
          <Ionicons
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            name="add"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.addLabel}>Add reward</Text>
        </Pressable>
      </View>
      {rewards.length > 0 ? (
        <View style={styles.list}>
          {rewards.map((reward, index) => (
            <ActiveRewardRow
              key={reward.id}
              reward={reward}
              busy={busy}
              last={index === rewards.length - 1}
              onEdit={() => onEdit(reward)}
              onDelete={() => onDelete(reward)}
              onRedeem={() => onRedeem(reward)}
            />
          ))}
        </View>
      ) : (
        <View style={[styles.list, styles.empty]}>
          <Text style={styles.emptyTitle}>No rewards yet</Text>
          <Text style={styles.emptyCopy}>
            Add one, and your points will count toward it.
          </Text>
        </View>
      )}
      {canLoadMore ? (
        <GhostButton
          label="Load more rewards"
          disabled={busy}
          onPress={onLoadMore}
        />
      ) : null}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    section: { width: "100%" },
    header: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: space[3],
    },
    heading: { minHeight: 48, flexShrink: 1, justifyContent: "center" },
    label: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "500",
    },
    add: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      gap: space[1],
      paddingStart: space[3],
    },
    addPressed: { opacity: 0.75 },
    addLabel: {
      color: colors.primary,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "600",
    },
    disabled: { opacity: 0.5 },
    list: { width: "100%" },
    empty: {
      gap: space[1],
      paddingVertical: space[5],
    },
    emptyTitle: {
      color: colors.ink,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "600",
    },
    emptyCopy: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  });
