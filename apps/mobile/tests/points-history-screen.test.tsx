import { beforeEach, expect, jest, test } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useQueries } from "convex/react";
import { ConvexError } from "convex/values";
import PointsHistoryScreen from "../src/points-history/points-history-screen";

jest.mock("@orbii/backend", () => ({
  api: { points: { listTransactions: "points:listTransactions" } },
}));
jest.mock("convex/react", () => ({ useQueries: jest.fn() }));

const firstPageTransactions = [
  {
    id: "redemption-id",
    amount: -35,
    sourceType: "reward_redemption",
    sourceName: "Museum visit",
    localDate: "2026-10-10",
  },
  {
    id: "bonus-id",
    amount: 20,
    sourceType: "completion_bonus",
    sourceName: "Completion bonus",
    localDate: "2026-10-09",
  },
  {
    id: "habit-id",
    amount: 10,
    sourceType: "habit_award",
    sourceName: "Morning walk",
    localDate: "2026-10-08",
  },
];

const firstPageResult = {
  page: firstPageTransactions,
  isDone: false,
  continueCursor: "cursor-next",
};

const nextPageResult = {
  page: [
    {
      id: "older-habit-id",
      amount: 5,
      sourceType: "habit_award",
      sourceName: "Evening stretch",
      localDate: "2026-10-07",
    },
  ],
  isDone: true,
  continueCursor: "cursor-last",
};

const middlePageResult = {
  page: [
    {
      id: "middle-habit-id",
      amount: 5,
      sourceType: "habit_award",
      sourceName: "Afternoon stretch",
      localDate: "2026-10-07",
    },
  ],
  isDone: false,
  continueCursor: "cursor-third",
};

const thirdPageResult = {
  page: [
    {
      id: "third-habit-id",
      amount: 5,
      sourceType: "habit_award",
      sourceName: "Evening stretch",
      localDate: "2026-10-06",
    },
  ],
  isDone: true,
  continueCursor: "cursor-done",
};

interface PageRequest {
  cursor: string | null;
  endCursor?: string | null;
  id?: number;
  numItems: number;
}

const pageRequests: PageRequest[] = [];

beforeEach(() => {
  pageRequests.length = 0;
  jest.mocked(useQueries).mockImplementation((queries) => {
    return Object.fromEntries(
      Object.entries(queries).map(([key, query]) => {
        const { paginationOpts } = query.args as unknown as {
          paginationOpts: PageRequest;
        };
        const { cursor, id, numItems } = paginationOpts;
        pageRequests.push({ cursor, id, numItems });
        return [key, cursor === null ? firstPageResult : nextPageResult];
      }),
    ) as never;
  });
});

test("history shows signed transactions, saved local dates, and every loaded row", async () => {
  await render(<PointsHistoryScreen />);

  expect(screen.getByText("Museum visit")).toBeOnTheScreen();
  expect(screen.getByText("-35 pts")).toBeOnTheScreen();
  expect(screen.getByText("Oct 10, 2026")).toBeOnTheScreen();
  expect(screen.getByText("Completion bonus")).toBeOnTheScreen();
  expect(screen.getByText("+20 pts")).toBeOnTheScreen();
  expect(screen.getByText("Morning walk")).toBeOnTheScreen();
  expect(screen.queryByText(/balance/i)).toBeNull();
  expect(pageRequests).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ cursor: null, numItems: 20 }),
    ]),
  );

  await fireEvent.press(
    screen.getByRole("button", { name: "Load more transactions" }),
  );

  expect(screen.getByText("Evening stretch")).toBeOnTheScreen();
  expect(pageRequests).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ cursor: "cursor-next", numItems: 20 }),
    ]),
  );
  expect(
    screen.queryByRole("button", { name: "Load more transactions" }),
  ).toBeNull();
});

test("a later page error keeps earlier transactions visible and retries the same cursor", async () => {
  let pageQueryFailed = true;
  const consoleError = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});

  jest.mocked(useQueries).mockImplementation((queries) => {
    return Object.fromEntries(
      Object.entries(queries).map(([key, query]) => {
        const { paginationOpts } = query.args as unknown as {
          paginationOpts: PageRequest;
        };
        const { cursor } = paginationOpts;
        pageRequests.push(paginationOpts);

        if (cursor !== null && pageQueryFailed) {
          return [key, new Error("The next page failed to load")];
        }

        return [key, cursor === null ? firstPageResult : nextPageResult];
      }),
    ) as never;
  });

  try {
    await render(<PointsHistoryScreen />);

    await fireEvent.press(
      screen.getByRole("button", { name: "Load more transactions" }),
    );

    expect(screen.getByText("Museum visit")).toBeOnTheScreen();
    expect(
      screen.getByText("We couldn’t load your points history."),
    ).toBeOnTheScreen();

    const failedRequest = pageRequests.find(
      (request) => request.cursor === "cursor-next",
    );
    expect(failedRequest).toBeDefined();

    pageQueryFailed = false;
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));

    expect(screen.getByText("Museum visit")).toBeOnTheScreen();
    expect(screen.getByText("Evening stretch")).toBeOnTheScreen();

    const retryRequest = pageRequests
      .filter((request) => request.cursor === "cursor-next")
      .pop();
    expect(retryRequest?.cursor).toBe(failedRequest?.cursor);
    expect(retryRequest?.id).not.toBe(failedRequest?.id);
    expect(pageRequests.every((request) => request.numItems === 20)).toBe(true);
    expect(
      screen.queryByRole("button", { name: "Load more transactions" }),
    ).toBeNull();
  } finally {
    consoleError.mockRestore();
  }
});

test("an error from a retained page is shown and retried before later rows", async () => {
  let middlePageFailed = false;
  let middlePageRetryPending = false;
  const consoleError = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});

  jest.mocked(useQueries).mockImplementation((queries) => {
    return Object.fromEntries(
      Object.entries(queries).map(([key, query]) => {
        const { paginationOpts } = query.args as unknown as {
          paginationOpts: PageRequest;
        };
        const { cursor } = paginationOpts;
        pageRequests.push(paginationOpts);

        if (cursor === "cursor-next" && middlePageFailed) {
          return [key, new Error("The retained page failed to refresh")];
        }

        if (cursor === "cursor-next" && middlePageRetryPending) {
          return [key, undefined];
        }

        if (cursor === null) {
          return [key, firstPageResult];
        }

        return [
          key,
          cursor === "cursor-next" ? middlePageResult : thirdPageResult,
        ];
      }),
    ) as never;
  });

  try {
    const view = await render(<PointsHistoryScreen />);

    await fireEvent.press(
      screen.getByRole("button", { name: "Load more transactions" }),
    );
    expect(screen.getByText("Afternoon stretch")).toBeOnTheScreen();

    await fireEvent.press(
      screen.getByRole("button", { name: "Load more transactions" }),
    );
    expect(screen.getByText("Evening stretch")).toBeOnTheScreen();

    middlePageFailed = true;
    await view.rerender(<PointsHistoryScreen />);

    expect(screen.getByText("Museum visit")).toBeOnTheScreen();
    expect(screen.queryByText("Afternoon stretch")).toBeNull();
    expect(screen.queryByText("Evening stretch")).toBeNull();
    expect(
      screen.getByText("We couldn’t load your points history."),
    ).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Try again" })).toBeOnTheScreen();
    expect(
      screen.queryByRole("button", { name: "Load more transactions" }),
    ).toBeNull();

    const failedRequest = pageRequests
      .filter((request) => request.cursor === "cursor-next")
      .pop();
    middlePageFailed = false;
    middlePageRetryPending = true;
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));

    expect(screen.getByText("Loading more…")).toBeOnTheScreen();
    expect(screen.queryByText("Afternoon stretch")).toBeNull();
    expect(screen.queryByText("Evening stretch")).toBeNull();

    middlePageRetryPending = false;
    await view.rerender(<PointsHistoryScreen />);

    expect(screen.getByText("Museum visit")).toBeOnTheScreen();
    expect(screen.getByText("Afternoon stretch")).toBeOnTheScreen();
    expect(screen.getByText("Evening stretch")).toBeOnTheScreen();

    const retryRequest = pageRequests
      .filter((request) => request.cursor === "cursor-next")
      .pop();
    expect(retryRequest?.id).not.toBe(failedRequest?.id);
    expect(retryRequest?.endCursor).toBe("cursor-third");
  } finally {
    consoleError.mockRestore();
  }
});

test.each(["SplitRequired", "SplitRecommended", "oversized"] as const)(
  "pages marked %s are split before continuing pagination",
  async (pageStatus) => {
    const partialPageTransactions =
      pageStatus === "oversized"
        ? Array.from({ length: 41 }, (_, index) => ({
            id: `oversized-${index}`,
            amount: 1,
            sourceType: "habit_award",
            sourceName: `Oversized row ${index}`,
            localDate: "2026-10-10",
          }))
        : [
            {
              id: "partial-id",
              amount: 1,
              sourceType: "habit_award",
              sourceName: "Partial history row",
              localDate: "2026-10-10",
            },
          ];
    const partialPageResult = {
      page: partialPageTransactions,
      isDone: false,
      continueCursor: "cursor-split-end",
      splitCursor: "cursor-split-middle",
      ...(pageStatus === "oversized" ? {} : { pageStatus }),
    };
    const leftSplitResult = {
      page: [
        {
          id: "left-split-id",
          amount: 2,
          sourceType: "habit_award",
          sourceName: "First split row",
          localDate: "2026-10-10",
        },
      ],
      isDone: true,
      continueCursor: "cursor-split-middle",
    };
    const rightSplitResult = {
      page: [
        {
          id: "right-split-id",
          amount: 3,
          sourceType: "habit_award",
          sourceName: "Second split row",
          localDate: "2026-10-09",
        },
      ],
      isDone: false,
      continueCursor: "cursor-split-end",
    };
    const finalPageResult = {
      page: [
        {
          id: "final-page-id",
          amount: 4,
          sourceType: "habit_award",
          sourceName: "Final history row",
          localDate: "2026-10-08",
        },
      ],
      isDone: true,
      continueCursor: "cursor-final",
    };

    jest.mocked(useQueries).mockImplementation((queries) => {
      return Object.fromEntries(
        Object.entries(queries).map(([key, query]) => {
          const { paginationOpts } = query.args as unknown as {
            paginationOpts: PageRequest;
          };
          const { cursor, endCursor } = paginationOpts;
          pageRequests.push(paginationOpts);

          if (endCursor === "cursor-split-middle") {
            return [key, leftSplitResult];
          }

          if (
            cursor === "cursor-split-middle" &&
            endCursor === "cursor-split-end"
          ) {
            return [key, rightSplitResult];
          }

          if (cursor === "cursor-split-end" && endCursor === undefined) {
            return [key, finalPageResult];
          }

          return [key, partialPageResult];
        }),
      ) as never;
    });

    await render(<PointsHistoryScreen />);

    expect(await screen.findByText("First split row")).toBeOnTheScreen();
    expect(screen.getByText("Second split row")).toBeOnTheScreen();
    expect(screen.queryByText("Partial history row")).toBeNull();
    expect(pageRequests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          cursor: null,
          endCursor: "cursor-split-middle",
          numItems: 20,
        }),
        expect.objectContaining({
          cursor: "cursor-split-middle",
          endCursor: "cursor-split-end",
          numItems: 20,
        }),
      ]),
    );

    await fireEvent.press(
      screen.getByRole("button", { name: "Load more transactions" }),
    );

    expect(screen.getByText("Final history row")).toBeOnTheScreen();
    expect(pageRequests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ cursor: "cursor-split-end", numItems: 20 }),
      ]),
    );
  },
);

test("a failed split child is shown while its sibling is still loading", async () => {
  let leftSplitFailed = true;
  let rightSplitReady = false;
  const consoleError = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});
  const parentSplitResult = {
    page: [],
    isDone: false,
    continueCursor: "cursor-split-end",
    splitCursor: "cursor-split-middle",
    pageStatus: "SplitRequired",
  };
  const leftSplitResult = {
    page: [
      {
        id: "left-split-id",
        amount: 2,
        sourceType: "habit_award",
        sourceName: "First split row",
        localDate: "2026-10-10",
      },
    ],
    isDone: true,
    continueCursor: "cursor-split-middle",
  };
  const rightSplitResult = {
    page: [
      {
        id: "right-split-id",
        amount: 3,
        sourceType: "habit_award",
        sourceName: "Second split row",
        localDate: "2026-10-09",
      },
    ],
    isDone: false,
    continueCursor: "cursor-split-end",
  };

  jest.mocked(useQueries).mockImplementation((queries) => {
    return Object.fromEntries(
      Object.entries(queries).map(([key, query]) => {
        const { paginationOpts } = query.args as unknown as {
          paginationOpts: PageRequest;
        };
        const { cursor, endCursor } = paginationOpts;
        pageRequests.push(paginationOpts);

        if (cursor === null && endCursor === "cursor-split-middle") {
          return [
            key,
            leftSplitFailed
              ? new Error("The first split page failed")
              : leftSplitResult,
          ];
        }

        if (
          cursor === "cursor-split-middle" &&
          endCursor === "cursor-split-end"
        ) {
          return [key, rightSplitReady ? rightSplitResult : undefined];
        }

        return [key, parentSplitResult];
      }),
    ) as never;
  });

  try {
    const view = await render(<PointsHistoryScreen />);

    expect(
      await screen.findByText("We couldn’t load your points history."),
    ).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Try again" })).toBeOnTheScreen();

    leftSplitFailed = false;
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));

    expect(screen.getByText("First split row")).toBeOnTheScreen();
    expect(screen.getByText("Loading more…")).toBeOnTheScreen();

    rightSplitReady = true;
    await view.rerender(<PointsHistoryScreen />);

    expect(await screen.findByText("First split row")).toBeOnTheScreen();
    expect(screen.getByText("Second split row")).toBeOnTheScreen();
  } finally {
    consoleError.mockRestore();
  }
});

test("an invalid cursor resets history to a fresh first page", async () => {
  const consoleError = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});
  const invalidCursorError = new ConvexError({
    isConvexSystemError: true,
    paginationError: "InvalidCursor",
  });

  jest.mocked(useQueries).mockImplementation((queries) => {
    return Object.fromEntries(
      Object.entries(queries).map(([key, query]) => {
        const { paginationOpts } = query.args as unknown as {
          paginationOpts: PageRequest;
        };
        const { cursor } = paginationOpts;
        pageRequests.push(paginationOpts);

        return [key, cursor === null ? firstPageResult : invalidCursorError];
      }),
    ) as never;
  });

  try {
    await render(<PointsHistoryScreen />);
    const initialRequest = pageRequests.find((request) => {
      return request.cursor === null;
    });

    await fireEvent.press(
      screen.getByRole("button", { name: "Load more transactions" }),
    );

    expect(screen.getByText("Museum visit")).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "Load more transactions" }),
    ).toBeOnTheScreen();
    expect(
      pageRequests.some((request) => {
        return request.cursor === null && request.id !== initialRequest?.id;
      }),
    ).toBe(true);
  } finally {
    consoleError.mockRestore();
  }
});

test("rapid load-more presses request each cursor once", async () => {
  jest.mocked(useQueries).mockImplementation((queries) => {
    return Object.fromEntries(
      Object.entries(queries).map(([key, query]) => {
        const { paginationOpts } = query.args as unknown as {
          paginationOpts: PageRequest;
        };
        const { cursor } = paginationOpts;
        pageRequests.push(paginationOpts);

        if (cursor === null) {
          return [key, firstPageResult];
        }

        return [
          key,
          cursor === "cursor-next" ? middlePageResult : thirdPageResult,
        ];
      }),
    ) as never;
  });

  await render(<PointsHistoryScreen />);
  const loadMoreButton = screen.getByRole("button", {
    name: "Load more transactions",
  });
  const loadMoreOnPress = loadMoreButton.props.onClick as () => void;

  await act(() => {
    loadMoreOnPress();
    loadMoreOnPress();
  });

  expect(screen.getByText("Afternoon stretch")).toBeOnTheScreen();
  const nextPageRequestIds = pageRequests
    .filter((request) => request.cursor === "cursor-next")
    .map((request) => request.id);
  expect(new Set(nextPageRequestIds).size).toBe(1);

  await fireEvent.press(
    screen.getByRole("button", { name: "Load more transactions" }),
  );

  expect(screen.getByText("Evening stretch")).toBeOnTheScreen();
});
