import { type Palette, radius, space } from "@orbii/tokens";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { selectionFeedback } from "../../../components/controls/feedback";
import { useThemedStyles } from "../../../theme/use-theme";
import { formatPoints } from "../../rewards-utils";

interface RedeemRewardButtonProps {
  busy: boolean;
  cost: number;
  name: string;
  onRedeem: () => void;
}

export default function RedeemRewardButton({
  busy,
  cost,
  name,
  onRedeem,
}: RedeemRewardButtonProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Redeem ${name} for ${formatPoints(cost)}`}
      accessibilityState={{ disabled: busy }}
      disabled={busy}
      onPress={() => {
        selectionFeedback();
        onRedeem();
      }}
      style={({ pressed }) => [
        styles.target,
        busy && styles.disabled,
        pressed && !busy && styles.pressed,
      ]}
    >
      <View style={styles.button}>
        <Text style={styles.label}>Redeem</Text>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    target: {
      minHeight: 44,
      justifyContent: "center",
      alignSelf: "flex-start",
    },
    button: {
      minHeight: 36,
      justifyContent: "center",
      paddingHorizontal: space[4],
      borderRadius: radius.full,
      backgroundColor: colors.primarySoft,
    },
    pressed: { opacity: 0.72 },
    disabled: { opacity: 0.5 },
    label: {
      color: colors.primary,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "600",
    },
  });
