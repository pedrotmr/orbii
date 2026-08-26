import { colors, fontSize, space } from "@orbii/tokens";
import { StyleSheet, Text, View } from "react-native";

export default function TodayEmptyOrbit() {
  return (
    <View style={styles.block}>
      <Text style={styles.title}>Your Orbit is empty</Text>
      <Text style={styles.sub}>
        Reveal stays closed until you add at least one habit.
      </Text>
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
});
