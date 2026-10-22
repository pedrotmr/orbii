import Ionicons from "@expo/vector-icons/Ionicons";
import { type Palette, space } from "@orbii/tokens";
import {
  ActionSheetIOS,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import type { ActiveReward } from "../../rewards-types";
import { useTheme, useThemedStyles } from "../../../theme/use-theme";
import RedeemRewardButton from "./redeem-reward-button";
import RewardProgressRing from "./reward-progress-ring";

interface ActiveRewardRowProps {
  reward: ActiveReward;
  busy: boolean;
  last: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onRedeem: () => void;
}

const STACKED_WIDTH = 390;
const STACKED_FONT_SCALE = 1.5;

export default function ActiveRewardRow({
  reward,
  busy,
  last,
  onEdit,
  onDelete,
  onRedeem,
}: ActiveRewardRowProps) {
  const { colors, scheme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { fontScale, width } = useWindowDimensions();
  const progress =
    reward.cost > 0 ? Math.min(1, reward.pointsProgress / reward.cost) : 0;
  const cost = reward.cost.toLocaleString();
  const remaining = reward.pointsRemaining.toLocaleString();
  const stacked = width < STACKED_WIDTH || fontScale >= STACKED_FONT_SCALE;
  const progressLabel = reward.isEligible
    ? `${reward.name}, ${cost} points, ready to redeem`
    : `${reward.name}, ${cost} points, ${remaining} points to go`;

  const openOptions = () => {
    if (process.env.EXPO_OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: reward.name,
          options: ["Edit reward", "Delete reward", "Cancel"],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 2,
          userInterfaceStyle: scheme,
        },
        (index) => {
          if (index === 0) {
            onEdit();
          }

          if (index === 1) {
            onDelete();
          }
        },
      );
      return;
    }

    Alert.alert(
      reward.name,
      undefined,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete reward", style: "destructive", onPress: onDelete },
        { text: "Edit reward", onPress: onEdit },
      ],
      { cancelable: true },
    );
  };

  return (
    <View style={styles.row}>
      <RewardProgressRing progress={progress} ready={reward.isEligible} />
      <View style={styles.copy}>
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={progressLabel}
          accessibilityValue={{
            min: 0,
            max: 100,
            now: Math.round(progress * 100),
          }}
          style={styles.details}
        >
          <Text style={styles.name}>{reward.name}</Text>
          <Text style={styles.meta}>
            <Text style={styles.cost}>{cost} pts</Text>
            <Text> · </Text>
            <Text style={reward.isEligible ? styles.ready : styles.remaining}>
              {reward.isEligible ? "Ready" : `${remaining} to go`}
            </Text>
          </Text>
        </View>
        {stacked && reward.isEligible ? (
          <RedeemRewardButton
            busy={busy}
            cost={cost}
            name={reward.name}
            onRedeem={onRedeem}
          />
        ) : null}
      </View>
      <View style={styles.actions}>
        {!stacked && reward.isEligible ? (
          <RedeemRewardButton
            busy={busy}
            cost={cost}
            name={reward.name}
            onRedeem={onRedeem}
          />
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit or delete ${reward.name}`}
          accessibilityState={{ disabled: busy }}
          disabled={busy}
          onPress={openOptions}
          style={({ pressed }) => [
            styles.options,
            busy && styles.disabled,
            pressed && !busy && styles.optionsPressed,
          ]}
        >
          <Ionicons
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            name={
              process.env.EXPO_OS === "android"
                ? "ellipsis-vertical"
                : "ellipsis-horizontal"
            }
            size={20}
            color={colors.muted}
          />
        </Pressable>
      </View>
      {!last ? <View pointerEvents="none" style={styles.separator} /> : null}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: {
      position: "relative",
      minHeight: 72,
      flexDirection: "row",
      alignItems: "center",
      gap: space[3],
      paddingVertical: space[3],
    },
    separator: {
      position: "absolute",
      end: 0,
      bottom: 0,
      start: 52,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.line,
    },
    copy: {
      flex: 1,
      flexShrink: 1,
      gap: space[1],
    },
    details: {
      gap: space[1],
    },
    name: {
      color: colors.ink,
      fontSize: 17,
      lineHeight: 22,
      fontWeight: "600",
    },
    meta: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
      fontVariant: ["tabular-nums"],
    },
    cost: {
      color: colors.ink,
      fontWeight: "600",
    },
    ready: {
      color: colors.success,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "600",
    },
    remaining: {
      color: colors.muted,
      fontWeight: "500",
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[1],
    },
    options: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    optionsPressed: { opacity: 0.5 },
    disabled: { opacity: 0.5 },
  });
