import { api } from "@orbii/backend";
import { type Palette, radius, space } from "@orbii/tokens";
import { usePaginatedQuery } from "convex/react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import BootSpinner from "../../components/boot-spinner";
import GhostButton from "../../components/ghost-button";
import ScreenScaffold from "../../components/layout/screen-scaffold";
import { useTheme, useThemedStyles } from "../../theme/use-theme";
import PointTransactionRow from "./point-transaction-row";

export default function PointsHistoryContent() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { results, status, isLoading, loadMore } = usePaginatedQuery(
    api.points.listTransactions,
    {},
    { initialNumItems: 20 },
  );

  if (status === "LoadingFirstPage") {
    return <BootSpinner label="Loading points history" />;
  }

  return (
    <ScreenScaffold scrollable={false}>
      <FlatList
        data={results}
        keyExtractor={(transaction) => transaction.id}
        renderItem={({ item }) => <PointTransactionRow transaction={item} />}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.heading}>
            <Text accessibilityRole="header" style={styles.title}>
              Transactions
            </Text>
            <Text style={styles.subtitle}>
              Every change to your points, newest first.
            </Text>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingLabel}>Loading transactions…</Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No point changes yet.</Text>
              <Text style={styles.emptyCopy}>
                Points earned and spent will appear here.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          status === "CanLoadMore" ? (
            <GhostButton
              label="Load more transactions"
              onPress={() => loadMore(20)}
            />
          ) : status === "LoadingMore" ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingLabel}>Loading more…</Text>
            </View>
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      />
    </ScreenScaffold>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    content: {
      flexGrow: 1,
      paddingHorizontal: space[6],
      paddingTop: space[4],
      paddingBottom: space[6],
      width: "100%",
      maxWidth: 560,
      alignSelf: "center",
    },
    heading: { gap: space[2], marginBottom: space[4] },
    title: { color: colors.ink, fontSize: 22, fontWeight: "700" },
    subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22 },
    loading: {
      alignItems: "center",
      gap: space[3],
      paddingVertical: space[8],
    },
    loadingMore: {
      minHeight: 56,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: space[3],
    },
    loadingLabel: { color: colors.muted, fontSize: 14 },
    empty: {
      alignItems: "center",
      gap: space[3],
      padding: space[8],
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
    },
    emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: "600" },
    emptyCopy: { color: colors.muted, fontSize: 14, textAlign: "center" },
  });
