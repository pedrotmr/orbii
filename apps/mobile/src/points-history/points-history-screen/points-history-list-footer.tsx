import { type Palette, space } from "@orbii/tokens";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import GhostButton from "../../components/ghost-button";
import { useTheme, useThemedStyles } from "../../theme/use-theme";

interface PointsHistoryListFooterProps {
  canLoadMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}

export default function PointsHistoryListFooter({
  canLoadMore,
  isLoadingMore,
  onLoadMore,
}: PointsHistoryListFooterProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  if (canLoadMore) {
    return <GhostButton label="Load more transactions" onPress={onLoadMore} />;
  }

  if (isLoadingMore) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingLabel}>Loading more…</Text>
      </View>
    );
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
