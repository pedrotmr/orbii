import { api } from "@orbii/backend";
import { type Palette, radius, space } from "@orbii/tokens";
import { useQueries } from "convex/react";
import { ConvexError } from "convex/values";
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
  endCursor?: string;
  queryId: number;
}

interface PointHistorySplit {
  left: PointHistoryPage;
  right: PointHistoryPage;
}

interface PaginationErrorData {
  isConvexSystemError?: unknown;
  paginationError?: unknown;
}

const queryKeyForPage = (pageKey: number) => `page-${pageKey}`;

const isInvalidCursorError = (error: Error) => {
  if (error.message.includes("InvalidCursor")) {
    return true;
  }

  if (
    !(error instanceof ConvexError) ||
    typeof error.data !== "object" ||
    error.data === null ||
    Array.isArray(error.data)
  ) {
    return false;
  }

  const errorData = error.data as PaginationErrorData;
  return (
    errorData.isConvexSystemError === true &&
    errorData.paginationError === "InvalidCursor"
  );
};

export default function PointsHistoryContent() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [pages, setPages] = useState<PointHistoryPage[]>([
    { key: 0, cursor: null, queryId: 0 },
  ]);
  const [splits, setSplits] = useState<Record<number, PointHistorySplit>>({});
  const nextPageKey = useRef(1);
  const nextQueryId = useRef(1);
  const pendingLoadMorePageKey = useRef<number | null>(null);
  const queriedPages = useMemo(
    () => [
      ...pages,
      ...Object.values(splits).flatMap(({ left, right }) => [left, right]),
    ],
    [pages, splits],
  );
  const pageQueries = useMemo(
    () =>
      Object.fromEntries(
        queriedPages.map((page) => [
          queryKeyForPage(page.key),
          {
            query: api.points.listTransactions,
            args: {
              paginationOpts: {
                numItems: 20,
                cursor: page.cursor,
                endCursor: page.endCursor,
                id: page.queryId,
              },
            },
          },
        ]),
      ),
    [queriedPages],
  );
  const pageResults = useQueries(pageQueries) as Record<
    string,
    PointTransactionPage | Error | undefined
  >;
  const loggedPageErrors = useRef(new Set<string>());

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

  useEffect(() => {
    const pendingPageKey = pendingLoadMorePageKey.current;

    if (
      pendingPageKey !== null &&
      pageResults[queryKeyForPage(pendingPageKey)] !== undefined
    ) {
      pendingLoadMorePageKey.current = null;
    }
  }, [pageResults]);

  useEffect(() => {
    const completedSplits = Object.entries(splits)
      .map(([parentKey, split]) => ({ parentKey: Number(parentKey), split }))
      .filter(({ split }) => {
        return (
          pageResults[queryKeyForPage(split.left.key)] !== undefined &&
          pageResults[queryKeyForPage(split.right.key)] !== undefined
        );
      });

    if (completedSplits.length > 0) {
      setPages((currentPages) => {
        let nextPages = currentPages;

        for (const { parentKey, split } of completedSplits) {
          const pageIndex = nextPages.findIndex((page) => {
            return page.key === parentKey;
          });

          if (pageIndex !== -1) {
            nextPages = [
              ...nextPages.slice(0, pageIndex),
              split.left,
              split.right,
              ...nextPages.slice(pageIndex + 1),
            ];
          }
        }

        return nextPages;
      });

      const completedParentKeys = new Set(
        completedSplits.map(({ parentKey }) => parentKey),
      );
      setSplits((currentSplits) => {
        const nextSplits = { ...currentSplits };

        for (const parentKey of completedParentKeys) {
          delete nextSplits[parentKey];
        }

        return nextSplits;
      });
    }

    const newSplits: Array<[number, PointHistorySplit]> = [];

    for (const page of pages) {
      if (splits[page.key] !== undefined) {
        continue;
      }

      const result = pageResults[queryKeyForPage(page.key)];

      if (
        result === undefined ||
        result instanceof Error ||
        result.splitCursor == null ||
        (result.pageStatus !== "SplitRecommended" &&
          result.pageStatus !== "SplitRequired")
      ) {
        continue;
      }

      const leftKey = nextPageKey.current;
      nextPageKey.current += 1;
      const rightKey = nextPageKey.current;
      nextPageKey.current += 1;
      const leftQueryId = nextQueryId.current;
      nextQueryId.current += 1;
      const rightQueryId = nextQueryId.current;
      nextQueryId.current += 1;

      newSplits.push([
        page.key,
        {
          left: {
            key: leftKey,
            cursor: page.cursor,
            endCursor: result.splitCursor,
            queryId: leftQueryId,
          },
          right: {
            key: rightKey,
            cursor: result.splitCursor,
            endCursor: result.continueCursor,
            queryId: rightQueryId,
          },
        },
      ]);
    }

    if (newSplits.length > 0) {
      setSplits((currentSplits) => {
        let nextSplits = currentSplits;

        for (const [parentKey, split] of newSplits) {
          if (nextSplits[parentKey] === undefined) {
            nextSplits = { ...nextSplits, [parentKey]: split };
          }
        }

        return nextSplits;
      });
    }
  }, [pageResults, pages, splits]);

  const invalidCursorPage = queriedPages.find((page) => {
    if (page.cursor === null && page.endCursor === undefined) {
      return false;
    }

    const result = pageResults[queryKeyForPage(page.key)];
    return result instanceof Error && isInvalidCursorError(result);
  });

  useEffect(() => {
    if (invalidCursorPage === undefined) {
      return;
    }

    const key = nextPageKey.current;
    nextPageKey.current += 1;
    const queryId = nextQueryId.current;
    nextQueryId.current += 1;
    pendingLoadMorePageKey.current = null;
    setPages([{ key, cursor: null, queryId }]);
    setSplits({});
  }, [invalidCursorPage]);

  const erroredPage = pages.find((page) => {
    const result = pageResults[queryKeyForPage(page.key)];

    return (
      result instanceof Error &&
      !(
        (page.cursor !== null || page.endCursor !== undefined) &&
        isInvalidCursorError(result)
      )
    );
  });
  const unsplittablePage = pages.find((page) => {
    const result = pageResults[queryKeyForPage(page.key)];

    return (
      result !== undefined &&
      !(result instanceof Error) &&
      result.pageStatus === "SplitRequired" &&
      result.splitCursor == null
    );
  });
  const failedPage = erroredPage ?? unsplittablePage;
  const isSplitting =
    Object.keys(splits).length > 0 ||
    pages.some((page) => {
      const result = pageResults[queryKeyForPage(page.key)];

      return (
        result !== undefined &&
        !(result instanceof Error) &&
        result.splitCursor != null &&
        (result.pageStatus === "SplitRecommended" ||
          result.pageStatus === "SplitRequired")
      );
    });
  const transactions: PointTransaction[] = [];

  for (const page of pages) {
    const result = pageResults[queryKeyForPage(page.key)];

    if (
      result === undefined ||
      result instanceof Error ||
      result.pageStatus === "SplitRequired"
    ) {
      break;
    }

    transactions.push(...result.page);
  }

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
      pendingLoadMorePageKey.current !== null ||
      invalidCursorPage !== undefined ||
      failedPage !== undefined ||
      isSplitting ||
      pages.some(
        (page) => pageResults[queryKeyForPage(page.key)] === undefined,
      ) ||
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
    pendingLoadMorePageKey.current = key;
    setPages((currentPages) => [
      ...currentPages,
      { key, cursor: latestResult.continueCursor, queryId },
    ]);
  };

  const listEmptyState = () => {
    if (transactions.length > 0) {
      return null;
    }

    if (failedPage !== undefined) {
      return <PointsHistoryError onRetry={() => retryPage(failedPage.key)} />;
    }

    const firstResult = firstPage
      ? pageResults[queryKeyForPage(firstPage.key)]
      : undefined;

    if (
      firstResult === undefined ||
      isSplitting ||
      invalidCursorPage !== undefined
    ) {
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

  if (invalidCursorPage !== undefined) {
    footerStatus = transactions.length === 0 ? "hidden" : "loading";
  } else if (failedPage !== undefined) {
    footerStatus = transactions.length === 0 ? "hidden" : "error";
  } else if (isSplitting) {
    footerStatus = transactions.length === 0 ? "hidden" : "loading";
  } else if (latestPage !== undefined && latestResult === undefined) {
    footerStatus = latestPage.key === firstPage?.key ? "hidden" : "loading";
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
            if (failedPage !== undefined) {
              retryPage(failedPage.key);
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
