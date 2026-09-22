import Ionicons from "@expo/vector-icons/Ionicons";
import { type Palette, radius, space } from "@orbii/tokens";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, { FadeIn, ReduceMotion } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { useTheme, useThemedStyles } from "../../theme/use-theme";
import FocusSegment from "./focus-segment";

interface FocusOrbitProps {
  total: number;
  completed?: number;
  mode?: "ready" | "active" | "complete";
  compact?: boolean;
}

export default function FocusOrbit({
  total,
  completed = 0,
  mode = "ready",
  compact,
}: FocusOrbitProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  const diameter = Math.min(compact ? 214 : 240, width - space[6] * 2);
  const count = Math.max(1, total);
  const done = mode === "complete";
  const label =
    mode === "ready"
      ? `Room for ${total} ${total === 1 ? "habit" : "habits"}`
      : `${completed} of ${total} daily habits complete`;
  let caption = "completed";
  if (mode === "ready") {
    caption = "room for today";
  } else if (done) {
    caption = "all done";
  }
  return (
    <View
      accessible
      accessibilityLabel={label}
      style={[
        styles.wrap,
        { width: diameter, height: diameter },
        compact && styles.compact,
      ]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 260 260" accessible={false}>
        <Circle
          cx="130"
          cy="130"
          r="125"
          stroke={colors.line}
          strokeWidth="1"
          fill="none"
        />
        {Array.from({ length: count }, (_, i) => (
          <FocusSegment
            key={i}
            index={i}
            count={count}
            completed={i < completed || done}
          />
        ))}
        <Circle
          cx="130"
          cy="130"
          r="78"
          fill={done ? colors.primarySoft : colors.surface}
        />
      </Svg>
      <View
        style={styles.center}
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
      >
        <Animated.View
          key={done ? "done" : String(completed)}
          entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)}
          style={styles.centerContent}
        >
          {done ? (
            <Ionicons
              accessible={false}
              importantForAccessibility="no-hide-descendants"
              name="checkmark"
              color={colors.primary}
              size={64}
            />
          ) : (
            <Text style={styles.number} maxFontSizeMultiplier={1.4}>
              {mode === "ready" ? total : completed}
              <Text style={styles.denominator}>
                {mode === "active" ? ` / ${total}` : ""}
              </Text>
            </Text>
          )}
          <Text style={styles.caption} maxFontSizeMultiplier={1.4}>
            {caption}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}
const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: {
      alignSelf: "center",
      marginVertical: 12,
    },
    compact: { marginVertical: 4 },
    center: {
      ...StyleSheet.absoluteFill,
      alignItems: "center",
      justifyContent: "center",
    },
    centerContent: { alignItems: "center", justifyContent: "center", gap: 2 },
    number: {
      fontSize: 58,
      fontWeight: "600",
      color: colors.ink,
      fontVariant: ["tabular-nums"],
      letterSpacing: -2,
    },
    denominator: { fontSize: 23, color: colors.muted, letterSpacing: -0.4 },
    caption: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "500",
      borderRadius: radius.full,
    },
  });
