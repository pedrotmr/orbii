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

interface PageRequest {
  cursor: string | null;
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
