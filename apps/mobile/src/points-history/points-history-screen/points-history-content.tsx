import { api } from "@orbii/backend";
import { type Palette, radius, space } from "@orbii/tokens";
import { useQueries } from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type {
  PointTransaction,
  PointTransactionPage,
} from "../points-history-types";
import { useTheme, useThemedStyles } from "../../theme/use-theme";
import PointTransactionRow from "./point-transaction-row";
import PointsHistoryError from "./points-history-error";
import PointsHistoryListFooter from "./points-history-list-footer";

interface PointHistoryPage {
  key: number;
  cursor: string | null;
  queryId: number;
}

const queryKeyForPage = (pageKey: number) => `page-${pageKey}`;

export default function PointsHistoryContent() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [pages, setPages] = useState<PointHistoryPage[]>([
    { key: 0, cursor: null, queryId: 0 },
  ]);
  const nextPageKey = useRef(1);
  const nextQueryId = useRef(1);
  const pageQueries = useMemo(
    () =>
      Object.fromEntries(
        pages.map((page) => [
          queryKeyForPage(page.key),
          {
            query: api.points.listTransactions,
            args: {
              paginationOpts: {
                numItems: 20,
                cursor: page.cursor,
                id: page.queryId,
              },
            },
          },
        ]),
      ),
    [pages],
  );
  const pageResults = useQueries(pageQueries) as Record<
    string,
    PointTransactionPage | Error | undefined
  >;
  const loggedPageErrors = useRef(new Set<string>());
  const transactions: PointTransaction[] = pages.flatMap((page) => {
    const result = pageResults[queryKeyForPage(page.key)];
    return result === undefined || result instanceof Error ? [] : result.page;
  });

  useEffect(() => {
    for (const page of pages) {
      const result = pageResults[queryKeyForPage(page.key)];
      const errorKey = `${page.key}:${page.queryId}`;

      if (result instanceof Error && !loggedPageErrors.current.has(errorKey)) {
        loggedPageErrors.current.add(errorKey);
        console.error("Failed to load points history page", result, {
          cursor: page.cursor,
        });
      }
    }
  }, [pageResults, pages]);
  const firstPage = pages[0];
  const latestPage = pages[pages.length - 1];
  const latestResult = latestPage
    ? pageResults[queryKeyForPage(latestPage.key)]
    : undefined;

  const retryPage = (pageKey: number) => {
    const queryId = nextQueryId.current;
    nextQueryId.current += 1;
    setPages((currentPages) =>
      currentPages.map((page) =>
        page.key === pageKey ? { ...page, queryId } : page,
      ),
    );
  };

  const loadMore = () => {
    if (
      latestPage === undefined ||
      latestResult === undefined ||
      latestResult instanceof Error ||
      latestResult.isDone
    ) {
      return;
    }

    const key = nextPageKey.current;
    nextPageKey.current += 1;
    const queryId = nextQueryId.current;
    nextQueryId.current += 1;
    setPages((currentPages) => [
      ...currentPages,
      { key, cursor: latestResult.continueCursor, queryId },
    ]);
  };

  const listEmptyState = () => {
    const firstResult = firstPage
      ? pageResults[queryKeyForPage(firstPage.key)]
      : undefined;

    if (transactions.length > 0) {
      return null;
    }

    if (firstResult === undefined) {
      return (
        <View
          accessible
          accessibilityLabel="Loading transactions"
          accessibilityState={{ busy: true }}
          style={styles.loading}
        >
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingLabel}>Loading transactions…</Text>
        </View>
      );
    }

    if (firstResult instanceof Error && firstPage !== undefined) {
      return <PointsHistoryError onRetry={() => retryPage(firstPage.key)} />;
    }

    if (
      latestResult !== undefined &&
      !(latestResult instanceof Error) &&
      latestResult.isDone
    ) {
      return (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No point changes yet.</Text>
          <Text style={styles.emptyCopy}>
            Points earned and spent will appear here.
          </Text>
        </View>
      );
    }

    return null;
  };

  let footerStatus: "hidden" | "loading" | "can-load-more" | "error" = "hidden";

  if (latestPage !== undefined && latestResult === undefined) {
    footerStatus = latestPage.key === firstPage?.key ? "hidden" : "loading";
  } else if (latestPage !== undefined && latestResult instanceof Error) {
    footerStatus = latestPage.key === firstPage?.key ? "hidden" : "error";
  } else if (
    latestResult !== undefined &&
    !(latestResult instanceof Error) &&
    !latestResult.isDone
  ) {
    footerStatus = "can-load-more";
  }

  return (
    <FlatList
      data={transactions}
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
      ListEmptyComponent={listEmptyState}
      ListFooterComponent={
        <PointsHistoryListFooter
          status={footerStatus}
          onLoadMore={loadMore}
          onRetry={() => {
            if (latestPage !== undefined) {
              retryPage(latestPage.key);
            }
          }}
        />
      }
      showsVerticalScrollIndicator={false}
    />
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
      minHeight: 144,
      alignItems: "center",
      justifyContent: "center",
      gap: space[3],
      paddingVertical: space[8],
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
