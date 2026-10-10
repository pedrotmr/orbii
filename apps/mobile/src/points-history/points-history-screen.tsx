import { api } from "@orbii/backend";
import { type Palette, radius, space } from "@orbii/tokens";
import { usePaginatedQuery } from "convex/react";
import { StyleSheet, Text, View } from "react-native";
import BootSpinner from "../components/boot-spinner";
import GhostButton from "../components/ghost-button";
import ScreenScaffold from "../components/layout/screen-scaffold";
import { useThemedStyles } from "../theme/use-theme";
import PointTransactionRow from "./points-history-screen/point-transaction-row";

export default function PointsHistoryScreen() {
  const styles = useThemedStyles(createStyles);
  const { results, status, loadMore } = usePaginatedQuery(
    api.points.listTransactions,
    {},
    { initialNumItems: 20 },
  );

  if (status === "LoadingFirstPage") {
    return <BootSpinner label="Loading points history" />;
  }

  return (
    <ScreenScaffold>
      <Text style={styles.subtitle}>
        Every change to your points, from newest to oldest.
      </Text>
      {results.length > 0 ? (
        <View style={styles.list}>
          {results.map((transaction) => (
            <PointTransactionRow
              key={transaction.id}
              transaction={transaction}
            />
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No point changes yet.</Text>
          <Text style={styles.emptyCopy}>
            Points earned and spent will appear here.
          </Text>
        </View>
      )}
      {status === "CanLoadMore" ? (
        <GhostButton
          label="Load more transactions"
          onPress={() => loadMore(20)}
        />
      ) : null}
    </ScreenScaffold>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22 },
    list: { gap: space[3] },
    empty: {
      alignItems: "center",
      gap: space[2],
      padding: space[8],
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
    },
    emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: "600" },
    emptyCopy: { color: colors.muted, fontSize: 14, textAlign: "center" },
  });
