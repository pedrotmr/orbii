import { beforeEach, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { usePaginatedQuery } from "convex/react";
import PointsHistoryScreen from "../src/points-history/points-history-screen";

jest.mock("@orbii/backend", () => ({
  api: { points: { listTransactions: "points:listTransactions" } },
}));
jest.mock("convex/react", () => ({ usePaginatedQuery: jest.fn() }));

const loadMore = jest.fn();
const firstPage = [
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

beforeEach(() => {
  jest.mocked(usePaginatedQuery).mockReturnValue({
    results: firstPage,
    status: "CanLoadMore",
    loadMore,
  } as never);
});

test("history shows signed transactions, saved local dates, and every loaded row", async () => {
  const view = await render(<PointsHistoryScreen />);

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

  expect(loadMore).toHaveBeenCalledWith(20);

  jest.mocked(usePaginatedQuery).mockReturnValue({
    results: [
      ...firstPage,
      {
        id: "older-habit-id",
        amount: 5,
        sourceType: "habit_award",
        sourceName: "Evening stretch",
        localDate: "2026-10-07",
      },
    ],
    status: "Exhausted",
    loadMore,
  } as never);
  await view.rerender(<PointsHistoryScreen />);
  expect(screen.getByText("Evening stretch")).toBeOnTheScreen();
});
