import { type Palette, space } from "@orbii/tokens";
import { StyleSheet, Text, View } from "react-native";
import type { RedeemedReward } from "../../rewards-types";
import { useThemedStyles } from "../../../theme/use-theme";

interface RedeemedRewardRowProps {
  reward: RedeemedReward;
  last: boolean;
}

const redeemedDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const formatRedeemedDate = (localDate: string) => {
  return redeemedDateFormatter.format(new Date(`${localDate}T12:00:00.000Z`));
};

export default function RedeemedRewardRow({
  reward,
  last,
}: RedeemedRewardRowProps) {
  const styles = useThemedStyles(createStyles);
  const cost = reward.cost.toLocaleString();
  const date = reward.redeemedLocalDate
    ? formatRedeemedDate(reward.redeemedLocalDate)
    : null;
  const accessibilityLabel = date
    ? `${reward.name}, redeemed ${date} for ${cost} points`
    : `${reward.name}, redeemed for ${cost} points`;

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      style={[styles.row, !last && styles.separated]}
    >
      <View style={styles.copy}>
        <Text selectable style={styles.name}>
          {reward.name}
        </Text>
        {date ? (
          <Text selectable style={styles.date}>
            {date}
          </Text>
        ) : null}
      </View>
      <Text selectable style={styles.cost}>
        −{cost} pts
      </Text>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: {
      minHeight: 64,
      flexDirection: "row",
      alignItems: "center",
      gap: space[4],
      paddingVertical: space[3],
    },
    separated: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.line,
    },
    copy: { flex: 1, gap: 2 },
    name: {
      color: colors.ink,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "500",
    },
    date: { color: colors.muted, fontSize: 14, lineHeight: 20 },
    cost: {
      color: colors.muted,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "600",
      fontVariant: ["tabular-nums"],
    },
  });
