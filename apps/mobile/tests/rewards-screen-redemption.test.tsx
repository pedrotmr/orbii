import { beforeEach, expect, jest, test } from "@jest/globals";
import { api } from "@orbii/backend";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { ActionSheetIOS, Alert } from "react-native";
import type { ActiveReward } from "../src/rewards/rewards-types";
import RewardsScreen from "../src/rewards/rewards-screen";

jest.mock("@orbii/backend", () => ({
  api: {
    users: { get: "users:get" },
    rewards: {
      list: "rewards:list",
      listRedeemed: "rewards:listRedeemed",
      create: "rewards:create",
      update: "rewards:update",
      deleteReward: "rewards:deleteReward",
      redeem: "rewards:redeem",
    },
  },
}));
jest.mock("convex/react", () => ({
  useMutation: jest.fn(),
  usePaginatedQuery: jest.fn(),
  useQuery: jest.fn(),
}));

const reward: ActiveReward = {
  id: "reward-id" as ActiveReward["id"],
  name: "A concert",
  cost: 100,
  pointsProgress: 100,
  pointsRemaining: 0,
  isEligible: true,
};

const activePage = {
  results: [reward],
  status: "Exhausted",
  loadMore: jest.fn(),
};
const redeemedPage = {
  results: [],
  status: "Exhausted",
  loadMore: jest.fn(),
};
const redeemReward = jest.fn(
  async (_args: { rewardId: ActiveReward["id"] }) => undefined,
);
const deleteReward = jest.fn(
  async (_args: { rewardId: ActiveReward["id"] }) => undefined,
);
const noOp = jest.fn(async () => undefined);

const mockPages = (active: unknown, redeemed: unknown) => {
  jest.mocked(usePaginatedQuery).mockImplementation((reference) => {
    return (reference as unknown as string) ===
      (api.rewards.list as unknown as string)
      ? (active as never)
      : (redeemed as never);
  });
};

beforeEach(() => {
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
  jest.mocked(useQuery).mockReturnValue({ pointsBalance: 250 } as never);
  mockPages(activePage, redeemedPage);
  jest.mocked(useMutation).mockImplementation((reference) => {
    if (
      (reference as unknown as string) ===
      (api.rewards.redeem as unknown as string)
    ) {
      return redeemReward as never;
    }

    if (
      (reference as unknown as string) ===
      (api.rewards.deleteReward as unknown as string)
    ) {
      return deleteReward as never;
    }

    return noOp as never;
  });
});

test("the shared balance leads the screen as its heading", async () => {
  await render(<RewardsScreen />);

  expect(screen.getByRole("header", { name: "250 points" })).toBeOnTheScreen();
  expect(
    screen.getByText("Your points count toward every reward."),
  ).toBeOnTheScreen();
});

test("eligible reward redemption requires explicit confirmation and shows the cost and remaining balance", async () => {
  await render(<RewardsScreen />);

  await fireEvent.press(
    screen.getByRole("button", { name: "Redeem A concert for 100 points" }),
  );

  expect(Alert.alert).toHaveBeenCalledWith(
    "Redeem “A concert”?",
    "Spend 100 of your 250 points? You’ll have 150 points left. This can’t be undone.",
    expect.any(Array),
  );
  expect(redeemReward).not.toHaveBeenCalled();

  const buttons = jest.mocked(Alert.alert).mock.lastCall?.[2];
  await act(async () => {
    buttons?.find((button) => button.text === "Redeem")?.onPress?.();
    await Promise.resolve();
  });

  expect(redeemReward).toHaveBeenCalledWith({ rewardId: reward.id });
});

test("deleting from the options sheet asks first and keeps the balance", async () => {
  jest
    .spyOn(ActionSheetIOS, "showActionSheetWithOptions")
    .mockImplementation((_options, choose) => choose(1));

  await render(<RewardsScreen />);

  await fireEvent.press(
    screen.getByRole("button", { name: "Edit or delete A concert" }),
  );

  expect(Alert.alert).toHaveBeenCalledWith(
    "Delete “A concert”?",
    "This can’t be undone. Your point balance stays the same.",
    expect.any(Array),
  );
  expect(deleteReward).not.toHaveBeenCalled();

  const buttons = jest.mocked(Alert.alert).mock.lastCall?.[2];
  await act(async () => {
    buttons?.find((button) => button.text === "Delete reward")?.onPress?.();
    await Promise.resolve();
  });

  expect(deleteReward).toHaveBeenCalledWith({ rewardId: reward.id });
});

test("an empty active list explains what a reward does", async () => {
  mockPages({ ...activePage, results: [] }, redeemedPage);

  await render(<RewardsScreen />);

  expect(screen.getByText("No rewards yet")).toBeOnTheScreen();
  expect(
    screen.getByText("Add one, and your points will count toward it."),
  ).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: "Add reward" })).toBeEnabled();
  expect(screen.getByText("Nothing redeemed yet.")).toBeOnTheScreen();
});

test("active goals render while redeemed reward history loads", async () => {
  mockPages(activePage, {
    results: [],
    status: "LoadingFirstPage",
    loadMore: jest.fn(),
  });

  await render(<RewardsScreen />);

  expect(screen.getByText("A concert")).toBeOnTheScreen();
  expect(screen.getByText("Loading redeemed rewards…")).toBeOnTheScreen();
});
