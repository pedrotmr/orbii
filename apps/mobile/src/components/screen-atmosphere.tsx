import type { ReactNode } from "react";
import { colors } from "@orbii/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View, type ColorValue } from "react-native";

interface ScreenAtmosphereProps {
  children: ReactNode;
  /** Reveal / celebrate get a warmer wash. */
  mood?: "default" | "reveal" | "celebrate";
}

type GradientStops = readonly [ColorValue, ColorValue, ColorValue];

export default function ScreenAtmosphere({
  children,
  mood = "default",
}: ScreenAtmosphereProps) {
  let gradient: GradientStops = [colors.bgDeep, colors.bgMid, colors.bg];

  if (mood === "reveal") {
    gradient = [colors.bgMid, colors.primarySoft, colors.bg];
  }

  if (mood === "celebrate") {
    gradient = [colors.successSoft, colors.bg, colors.bgMid];
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={gradient}
        locations={[0, 0.45, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
