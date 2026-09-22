import { type Palette, radius, space } from "@orbii/tokens";
import { StyleSheet, View } from "react-native";
import { useThemedStyles } from "../theme/use-theme";
import ScreenScaffold from "./layout/screen-scaffold";

export default function BootSpinner() {
  const styles = useThemedStyles(createStyles);
  return (
    <ScreenScaffold>
      <View
        accessible
        accessibilityLabel="Loading your Orbit"
        accessibilityState={{ busy: true }}
        style={styles.wrap}
      >
        <View style={styles.brand} />
        <View style={styles.title} />
        <View style={styles.subtitle} />
        <View style={styles.orbit} />
        <View style={styles.row} />
        <View style={styles.row} />
      </View>
    </ScreenScaffold>
  );
}
const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: { flex: 1, gap: space[4], paddingTop: space[2] },
    brand: {
      width: 76,
      height: 18,
      backgroundColor: colors.track,
      borderRadius: radius.sm,
      marginBottom: space[6],
    },
    title: {
      width: "75%",
      height: 34,
      backgroundColor: colors.track,
      borderRadius: radius.sm,
    },
    subtitle: {
      width: "90%",
      height: 18,
      backgroundColor: colors.track,
      borderRadius: radius.sm,
    },
    orbit: {
      width: 220,
      aspectRatio: 1,
      borderRadius: radius.full,
      borderWidth: 18,
      borderColor: colors.track,
      alignSelf: "center",
      marginVertical: space[8],
    },
    row: { height: 68, borderRadius: radius.lg, backgroundColor: colors.track },
  });
