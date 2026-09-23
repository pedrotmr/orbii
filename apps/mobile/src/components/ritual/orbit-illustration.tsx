import { type Palette, radius, space } from "@orbii/tokens";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Ellipse } from "react-native-svg";
import { useTheme, useThemedStyles } from "../../theme/use-theme";
import HabitIcon from "../habits/habit-icon";

export default function OrbitIllustration() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View
      accessible
      accessibilityLabel="A walk and a book, two examples of small daily habits"
      style={styles.stage}
    >
      <Svg width="100%" height="100%" viewBox="0 0 320 270" accessible={false}>
        <Ellipse
          cx="160"
          cy="135"
          rx="142"
          ry="83"
          rotation="-32"
          origin="160,135"
          fill="none"
          stroke={colors.line}
          strokeWidth="1.5"
        />
        <Ellipse cx="160" cy="135" rx="106" ry="106" fill={colors.bgMid} />
      </Svg>
      <View style={[styles.habit, styles.walk]}>
        <HabitIcon glyph="↗" size={48} selected />
        <View style={styles.meta}>
          <Text style={styles.name}>A short walk</Text>
          <Text style={styles.detail}>A little movement</Text>
        </View>
      </View>
      <View style={[styles.habit, styles.read]}>
        <HabitIcon glyph="▭" size={48} />
        <View style={styles.meta}>
          <Text style={styles.name}>A few pages</Text>
          <Text style={styles.detail}>A moment for you</Text>
        </View>
      </View>
    </View>
  );
}
const createStyles = (colors: Palette) =>
  StyleSheet.create({
    stage: {
      width: "100%",
      maxWidth: 330,
      height: 270,
      alignSelf: "center",
      marginVertical: space[3],
    },
    habit: {
      position: "absolute",
      flexDirection: "row",
      gap: space[3],
      alignItems: "center",
      padding: space[4],
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderCurve: "continuous",
    },
    walk: { left: 0, top: 42, transform: [{ rotate: "-7deg" }] },
    read: { right: 0, bottom: 36, transform: [{ rotate: "6deg" }] },
    meta: { gap: 4 },
    name: { fontSize: 17, fontWeight: "600", color: colors.ink },
    detail: { fontSize: 12, color: colors.muted },
  });
