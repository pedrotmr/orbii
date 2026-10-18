import { type Palette, radius, space } from "@orbii/tokens";
import { StyleSheet, Text, View } from "react-native";
import GhostButton from "../../components/ghost-button";
import ScreenScaffold from "../../components/layout/screen-scaffold";
import { useThemedStyles } from "../../theme/use-theme";

interface PointsHistoryErrorProps {
  onRetry: () => void;
}

export default function PointsHistoryError({
  onRetry,
}: PointsHistoryErrorProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <ScreenScaffold>
      <View style={styles.error}>
        <Text accessibilityRole="header" style={styles.title}>
          We couldn’t load your points history.
        </Text>
        <Text style={styles.copy}>Try again to reload your transactions.</Text>
        <GhostButton label="Try again" onPress={onRetry} />
      </View>
    </ScreenScaffold>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    error: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: space[3],
      padding: space[6],
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
    },
    title: {
      color: colors.ink,
      fontSize: 18,
      fontWeight: "700",
      textAlign: "center",
    },
    copy: { color: colors.muted, fontSize: 14, textAlign: "center" },
  });
