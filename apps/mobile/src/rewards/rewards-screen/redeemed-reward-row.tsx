import Ionicons from "@expo/vector-icons/Ionicons";
import { type Palette, radius, space } from "@orbii/tokens";
import { StyleSheet, Text, View } from "react-native";
import type { RedeemedReward } from "../rewards-types";
import { useTheme, useThemedStyles } from "../../theme/use-theme";

interface RedeemedRewardRowProps {
  reward: RedeemedReward;
}

export default function RedeemedRewardRow({ reward }: RedeemedRewardRowProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View accessibilityLabel={reward.name + " redeemed"} style={styles.card}>
      <View style={styles.icon}>
        <Ionicons name="checkmark" size={20} color={colors.success} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.name}>{reward.name}</Text>
        <Text style={styles.date}>
          {reward.redeemedLocalDate
            ? "Redeemed " + reward.redeemedLocalDate
            : "Redeemed"}
        </Text>
      </View>
      <Text style={styles.cost}>−{reward.cost.toLocaleString()} pts</Text>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      minHeight: 76,
      flexDirection: "row",
      alignItems: "center",
      gap: space[3],
      padding: space[4],
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
    },
    icon: {
      width: 42,
      height: 42,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.full,
      backgroundColor: colors.primarySoft,
    },
    copy: { flex: 1, gap: space[1] },
    name: { color: colors.ink, fontSize: 15, fontWeight: "600" },
    date: { color: colors.muted, fontSize: 13 },
    cost: { color: colors.muted, fontSize: 14, fontWeight: "600" },
  });
