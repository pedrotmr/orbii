import { OFFER_SIZE } from "@orbii/backend";
import { type Palette, space } from "@orbii/tokens";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, ReduceMotion } from "react-native-reanimated";
import PrimaryButton from "../../components/primary-button";
import FocusOrbit from "../../components/ritual/focus-orbit";
import { useThemedStyles } from "../../theme/use-theme";

interface TodayIdlePhaseProps {
  habitCount: number;
  capacity: number;
  streak: number;
  busy: boolean;
  onReveal: () => void;
}

export default function TodayIdlePhase({
  habitCount,
  capacity,
  streak,
  busy,
  onReveal,
}: TodayIdlePhaseProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <Animated.View
      entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)}
      style={styles.block}
    >
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>
          {"A little focus.\nA day well spent."}
        </Text>
        <Text style={styles.sub}>
          Your habits can wait their turn. Make room for a few today.
        </Text>
      </View>
      <FocusOrbit total={Math.min(capacity, habitCount)} />
      <View style={styles.footer}>
        <Text style={styles.detail}>
          {Math.min(OFFER_SIZE, habitCount)} options. You choose what fits.
        </Text>
        <PrimaryButton
          label={busy ? "Finding your options…" : "Find today’s focus"}
          disabled={busy}
          onPress={onReveal}
        />
        <Text style={styles.streak}>
          {streak > 0
            ? `${streak} ${streak === 1 ? "day" : "days"} in a row. One day at a time.`
            : "A fresh start, whenever you’re ready."}
        </Text>
      </View>
    </Animated.View>
  );
}
const createStyles = (colors: Palette) =>
  StyleSheet.create({
    block: { flexGrow: 1, gap: space[5] },
    heading: { gap: space[3] },
    title: {
      fontSize: 34,
      lineHeight: 39,
      fontWeight: "700",
      color: colors.ink,
      letterSpacing: -1,
    },
    sub: { fontSize: 17, color: colors.muted, lineHeight: 25, maxWidth: 310 },
    footer: { marginTop: "auto", gap: space[3], paddingTop: space[3] },
    detail: {
      textAlign: "center",
      color: colors.ink,
      fontSize: 15,
      fontWeight: "500",
    },
    streak: {
      textAlign: "center",
      color: colors.muted,
      fontSize: 13,
      lineHeight: 20,
    },
  });
