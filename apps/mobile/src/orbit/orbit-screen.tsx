import { colors, fontSize, space } from "@orbii/tokens";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OrbitScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.block}>
        <Text style={styles.brand}>Orbii</Text>
        <Text style={styles.eyebrow}>Orbit</Text>
        <Text style={styles.title}>Your full habit set</Text>
        <Text style={styles.sub}>
          List, add, and remove habits land in the next slice. Today still runs
          from your current Orbit.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  block: { padding: space[6], gap: space[3] },
  brand: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  eyebrow: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: fontSize["2xl"],
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: fontSize.md,
    color: colors.muted,
    lineHeight: 22,
  },
});
