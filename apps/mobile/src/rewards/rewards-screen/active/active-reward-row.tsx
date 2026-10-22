import Ionicons from "@expo/vector-icons/Ionicons";
import { type Palette, radius, space } from "@orbii/tokens";
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
import { selectionFeedback } from "../../../components/controls/feedback";
import { useTheme, useThemedStyles } from "../../../theme/use-theme";

interface ActiveRewardRowProps {
  reward: ActiveReward;
  busy: boolean;
  last: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onRedeem: () => void;
}

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
  const { fontScale } = useWindowDimensions();
  const progress =
    reward.cost > 0 ? Math.min(1, reward.pointsProgress / reward.cost) : 0;
  const cost = reward.cost.toLocaleString();
  const remaining = reward.pointsRemaining.toLocaleString();

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
    <View style={[styles.row, !last && styles.separated]}>
      <View
        accessible
        accessibilityLabel={`${reward.name}, ${cost} points`}
        style={[
          styles.identity,
          fontScale >= STACKED_FONT_SCALE && styles.identityStacked,
        ]}
      >
        <Text style={styles.name}>{reward.name}</Text>
        <Text style={styles.cost}>{cost} pts</Text>
      </View>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={`${reward.name} progress`}
        accessibilityValue={{
          min: 0,
          max: 100,
          now: Math.round(progress * 100),
        }}
        style={styles.track}
      >
        <View
          style={[
            styles.fill,
            { width: `${progress * 100}%` },
            progress > 0 && styles.fillVisible,
          ]}
        />
      </View>
      <View style={styles.footer}>
        <View
          accessible
          accessibilityLabel={
            reward.isEligible ? "Ready" : `${remaining} points to go`
          }
          style={styles.status}
        >
          {reward.isEligible ? (
            <Ionicons
              accessible={false}
              importantForAccessibility="no-hide-descendants"
              name="checkmark-circle"
              size={16}
              color={colors.success}
            />
          ) : null}
          <Text style={reward.isEligible ? styles.ready : styles.remaining}>
            {reward.isEligible ? "Ready" : `${remaining} pts to go`}
          </Text>
        </View>
        <View style={styles.actions}>
          {reward.isEligible ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Redeem ${reward.name} for ${cost} points`}
              accessibilityState={{ disabled: busy }}
              disabled={busy}
              onPress={() => {
                selectionFeedback();
                onRedeem();
              }}
              style={styles.redeemTarget}
            >
              {({ pressed }) => (
                <View
                  style={[
                    styles.redeem,
                    busy && styles.disabled,
                    pressed && !busy && styles.redeemPressed,
                  ]}
                >
                  <Text style={styles.redeemLabel}>Redeem</Text>
                </View>
              )}
            </Pressable>
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
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: {
      paddingHorizontal: space[4],
      paddingTop: space[4],
      paddingBottom: space[1],
    },
    separated: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.line,
    },
    identity: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: space[3],
    },
    identityStacked: {
      flexDirection: "column",
      alignItems: "flex-start",
      gap: space[1],
    },
    name: {
      flexShrink: 1,
      flexGrow: 1,
      color: colors.ink,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "600",
    },
    cost: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 22,
      fontWeight: "600",
      fontVariant: ["tabular-nums"],
    },
    track: {
      height: 6,
      marginTop: space[3],
      overflow: "hidden",
      borderRadius: radius.full,
      backgroundColor: colors.track,
    },
    fill: {
      height: "100%",
      borderRadius: radius.full,
      backgroundColor: colors.primary,
    },
    fillVisible: { minWidth: 6 },
    footer: {
      minHeight: 44,
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      columnGap: space[3],
      marginTop: space[1],
    },
    status: {
      minHeight: 44,
      flexShrink: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: space[1],
    },
    ready: {
      flexShrink: 1,
      color: colors.success,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "600",
    },
    remaining: {
      flexShrink: 1,
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "500",
      fontVariant: ["tabular-nums"],
    },
    actions: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      marginStart: "auto",
    },
    redeemTarget: { minHeight: 44, justifyContent: "center" },
    redeem: {
      minHeight: 36,
      justifyContent: "center",
      paddingHorizontal: space[4],
      borderRadius: radius.full,
      backgroundColor: colors.primary,
    },
    redeemPressed: { backgroundColor: colors.primaryDeep },
    redeemLabel: {
      color: colors.onPrimary,
      fontSize: 15,
      fontWeight: "600",
    },
    options: {
      width: 44,
      height: 44,
      alignItems: "flex-end",
      justifyContent: "center",
    },
    optionsPressed: { opacity: 0.5 },
    disabled: { opacity: 0.5 },
  });
