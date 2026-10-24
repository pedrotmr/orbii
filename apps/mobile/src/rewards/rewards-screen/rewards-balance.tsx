import { type Palette, space } from "@orbii/tokens";
import { StyleSheet, Text, View } from "react-native";
import { useThemedStyles } from "../../theme/use-theme";
import { formatPoints } from "../rewards-utils";

interface RewardsBalanceProps {
  balance: number;
}

export default function RewardsBalance({ balance }: RewardsBalanceProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.heading}>
      <Text accessibilityRole="header" selectable style={styles.title}>
        Rewards
      </Text>
      <Text style={styles.subtitle}>
        {formatPoints(balance)} to spend across rewards
      </Text>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    heading: { gap: space[1] },
    title: {
      color: colors.ink,
      fontSize: 34,
      lineHeight: 40,
      fontWeight: "700",
      letterSpacing: -1,
      fontVariant: ["tabular-nums"],
    },
    subtitle: {
      color: colors.muted,
      fontSize: 16,
      lineHeight: 24,
      fontVariant: ["tabular-nums"],
    },
  });
