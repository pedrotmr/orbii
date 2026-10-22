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
        {formatPoints(balance)}
      </Text>
      <Text style={styles.subtitle}>
        Your points count toward every reward.
      </Text>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    heading: { gap: space[2] },
    title: {
      color: colors.ink,
      fontSize: 34,
      lineHeight: 40,
      fontWeight: "700",
      letterSpacing: -1,
      fontVariant: ["tabular-nums"],
    },
    subtitle: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  });
