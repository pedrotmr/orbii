import { beforeEach, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { useQueries } from "convex/react";
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

beforeEach(() => {
  jest.mocked(useQueries).mockImplementation((queries) => {
    return Object.fromEntries(
      Object.entries(queries).map(([key, query]) => {
        const { paginationOpts } = query.args as unknown as {
          paginationOpts: { cursor: string | null };
        };
        const { cursor } = paginationOpts;
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

  await fireEvent.press(
    screen.getByRole("button", { name: "Load more transactions" }),
  );

  expect(screen.getByText("Evening stretch")).toBeOnTheScreen();
});

test("a later page error keeps earlier transactions visible and retries the same cursor", async () => {
  let pageQueryFailed = true;
  const pageRequests: Array<{ cursor: string | null; id: number | undefined }> =
    [];
  const consoleError = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});

  jest.mocked(useQueries).mockImplementation((queries) => {
    return Object.fromEntries(
      Object.entries(queries).map(([key, query]) => {
        const { paginationOpts } = query.args as unknown as {
          paginationOpts: { cursor: string | null; id?: number };
        };
        const { cursor, id } = paginationOpts;
        pageRequests.push({ cursor, id });

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
  } finally {
    consoleError.mockRestore();
  }
});
