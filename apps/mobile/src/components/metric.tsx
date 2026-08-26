import { colors, fonts, fontSize, radius, space } from "@orbii/tokens";
import { StyleSheet, Text, View } from "react-native";

interface MetricProps {
  label: string;
  value: string;
}

export default function Metric({ label, value }: MetricProps) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  metric: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space[3],
    borderWidth: 1,
    borderColor: colors.line,
  },
  metricValue: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.ink,
  },
  metricLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.muted,
    marginTop: 2,
  },
});
