import { type Palette, space } from "@orbii/tokens";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import GhostButton from "../../components/ghost-button";
import { useTheme, useThemedStyles } from "../../theme/use-theme";
import PointsHistoryError from "./points-history-error";

interface PointsHistoryListFooterProps {
  status: "hidden" | "loading" | "can-load-more" | "error";
  onLoadMore: () => void;
  onRetry: () => void;
}

export default function PointsHistoryListFooter({
  status,
  onLoadMore,
  onRetry,
}: PointsHistoryListFooterProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  if (status === "can-load-more") {
    return <GhostButton label="Load more transactions" onPress={onLoadMore} />;
  }

  if (status === "loading") {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingLabel}>Loading more…</Text>
      </View>
    );
  }

  if (status === "error") {
    return <PointsHistoryError onRetry={onRetry} />;
  }

  return null;
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    loading: {
      minHeight: 56,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: space[3],
    },
    loadingLabel: { color: colors.muted, fontSize: 14 },
  });
