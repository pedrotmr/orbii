import { OFFER_SIZE } from "@orbii/backend";
import { colors, fontSize, space } from "@orbii/tokens";
import { StyleSheet, Text, View } from "react-native";
import Metric from "../../components/metric";
import PrimaryButton from "../../components/primary-button";

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
  return (
    <View style={styles.block}>
      <Text style={styles.title}>Ready for today’s Orbit?</Text>
      <Text style={styles.sub}>
        We’ll offer {Math.min(OFFER_SIZE, habitCount)} options. Pick up to{" "}
        {capacity} you can actually do.
      </Text>
      <View style={styles.metrics}>
        <Metric label="In Orbit" value={String(habitCount)} />
        <Metric label="Day streak" value={String(streak)} />
        <Metric label="Capacity" value={String(capacity)} />
      </View>
      <PrimaryButton
        label="See today’s options"
        disabled={busy}
        onPress={onReveal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: space[3] },
  title: {
    fontSize: fontSize["2xl"],
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.6,
  },
  sub: {
    fontSize: fontSize.md,
    color: colors.muted,
    lineHeight: 22,
  },
  metrics: { flexDirection: "row", gap: space[2], marginVertical: space[2] },
});
