import Ionicons from "@expo/vector-icons/Ionicons";
import { type Palette, radius, space } from "@orbii/tokens";
import { StyleSheet, Text, View } from "react-native";
import { useTheme, useThemedStyles } from "../../theme/use-theme";

interface InlineErrorProps {
  message: string;
}

export default function InlineError({ message }: InlineErrorProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={styles.wrap}
    >
      <Ionicons
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        name="alert-circle-outline"
        size={22}
        color={colors.primaryDeep}
      />
      <Text selectable style={styles.message}>
        {message}
      </Text>
    </View>
  );
}
const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: space[2],
      padding: space[4],
      borderRadius: radius.md,
      backgroundColor: colors.primarySoft,
    },
    message: {
      flex: 1,
      color: colors.primaryDeep,
      fontSize: 14,
      lineHeight: 21,
    },
  });
