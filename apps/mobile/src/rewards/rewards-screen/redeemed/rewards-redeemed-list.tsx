import type { PaginationStatus } from "convex/react";
import { type Palette } from "@orbii/tokens";
import { StyleSheet, Text, View } from "react-native";
import type { RedeemedReward } from "../../rewards-types";
import GhostButton from "../../../components/ghost-button";
import { useThemedStyles } from "../../../theme/use-theme";
import RedeemedRewardRow from "./redeemed-reward-row";

interface RewardsRedeemedListProps {
  rewards: RedeemedReward[];
  status: PaginationStatus;
  busy: boolean;
  onLoadMore: () => void;
}

export default function RewardsRedeemedList({
  rewards,
  status,
  busy,
  onLoadMore,
}: RewardsRedeemedListProps) {
  const styles = useThemedStyles(createStyles);
  let content = <Text style={styles.placeholder}>Nothing redeemed yet.</Text>;

  if (status === "LoadingFirstPage") {
    content = <Text style={styles.placeholder}>Loading redeemed rewards…</Text>;
  }

  if (status !== "LoadingFirstPage" && rewards.length > 0) {
    content = (
      <View style={styles.list}>
        {rewards.map((reward, index) => (
          <RedeemedRewardRow
            key={reward.id}
            reward={reward}
            last={index === rewards.length - 1}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.label}>
          Redeemed
        </Text>
      </View>
      {content}
      {status === "CanLoadMore" ? (
        <GhostButton
          label="Load more redeemed rewards"
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
      justifyContent: "center",
    },
    label: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "500",
    },
    list: { width: "100%" },
    placeholder: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
    },
  });
