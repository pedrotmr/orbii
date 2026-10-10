import { beforeEach, expect, jest, test } from "@jest/globals";
import { api } from "@orbii/backend";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { Alert } from "react-native";
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
const noOp = jest.fn(async () => undefined);

beforeEach(() => {
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
  jest.mocked(useQuery).mockReturnValue({ pointsBalance: 250 } as never);
  jest.mocked(usePaginatedQuery).mockImplementation((reference) => {
    return (reference as unknown as string) ===
      (api.rewards.list as unknown as string)
      ? (activePage as never)
      : (redeemedPage as never);
  });
  jest.mocked(useMutation).mockImplementation((reference) => {
    return (reference as unknown as string) ===
      (api.rewards.redeem as unknown as string)
      ? (redeemReward as never)
      : (noOp as never);
  });
});

test("eligible reward redemption requires explicit confirmation and shows the cost and remaining balance", async () => {
  await render(<RewardsScreen />);

  await fireEvent.press(
    screen.getByRole("button", { name: "Redeem A concert for 100 points" }),
  );

  expect(Alert.alert).toHaveBeenCalledWith(
    "Redeem this reward?",
    "Spend 100 of your 250 points on A concert? You’ll have 150 points left. This can’t be undone.",
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

test("active goals render while redeemed reward history loads", async () => {
  jest.mocked(usePaginatedQuery).mockImplementation((reference) => {
    return (reference as unknown as string) ===
      (api.rewards.list as unknown as string)
      ? (activePage as never)
      : ({
          results: [],
          status: "LoadingFirstPage",
          loadMore: jest.fn(),
        } as never);
  });

  await render(<RewardsScreen />);

  expect(screen.getByText("A concert")).toBeOnTheScreen();
  expect(screen.getByText("Loading redeemed rewards…")).toBeOnTheScreen();
});
