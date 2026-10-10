import { expect, test } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import type { RedeemedReward } from "../src/rewards/rewards-types";
import RedeemedRewardRow from "../src/rewards/rewards-screen/redeemed-reward-row";

test("redeemed reward history shows the saved details without actions", async () => {
  const reward: RedeemedReward = {
    id: "reward-id" as RedeemedReward["id"],
    name: "Cabin weekend",
    cost: 175,
    redeemedAt: 1_792_000_000_000,
    redeemedLocalDate: "2026-10-10",
  };

  await render(<RedeemedRewardRow reward={reward} />);

  expect(screen.getByLabelText("Cabin weekend redeemed")).toBeOnTheScreen();
  expect(screen.getByText("Cabin weekend")).toBeOnTheScreen();
  expect(screen.getByText("Redeemed 2026-10-10")).toBeOnTheScreen();
  expect(screen.getByText("−175 pts")).toBeOnTheScreen();
  expect(screen.queryByRole("button")).toBeNull();
});
