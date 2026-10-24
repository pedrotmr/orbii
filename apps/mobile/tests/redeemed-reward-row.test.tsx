import { expect, test } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import type { RedeemedReward } from "../src/rewards/rewards-types";
import RedeemedRewardRow from "../src/rewards/rewards-screen/redeemed/redeemed-reward-row";

const expectedDate = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
}).format(new Date("2026-10-10T12:00:00.000Z"));

test("redeemed reward history shows the saved details without actions", async () => {
  const reward: RedeemedReward = {
    id: "reward-id" as RedeemedReward["id"],
    name: "Cabin weekend",
    cost: 175,
    redeemedAt: 1_792_000_000_000,
    redeemedLocalDate: "2026-10-10",
  };

  await render(<RedeemedRewardRow reward={reward} last />);

  expect(
    screen.getByLabelText(
      `Cabin weekend, redeemed ${expectedDate} for 175 points`,
    ),
  ).toBeOnTheScreen();
  expect(screen.getByText("Cabin weekend")).toBeOnTheScreen();
  expect(screen.getByText(expectedDate)).toBeOnTheScreen();
  expect(screen.getByText("−175 pts")).toBeOnTheScreen();
  expect(screen.queryByRole("button")).toBeNull();
});

test("redeemed reward history omits a missing redemption date", async () => {
  const reward: RedeemedReward = {
    id: "legacy-reward-id" as RedeemedReward["id"],
    name: "Cabin weekend",
    cost: 175,
    redeemedAt: null,
    redeemedLocalDate: null,
  };

  await render(<RedeemedRewardRow reward={reward} last />);

  expect(
    screen.getByLabelText("Cabin weekend, redeemed for 175 points"),
  ).toBeOnTheScreen();
});

test("redeemed reward history omits an invalid date without crashing", async () => {
  const reward: RedeemedReward = {
    id: "invalid-date-id" as RedeemedReward["id"],
    name: "Coffee",
    cost: 1,
    redeemedAt: null,
    redeemedLocalDate: "not-a-date",
  };

  await render(<RedeemedRewardRow reward={reward} last />);

  expect(
    screen.getByLabelText("Coffee, redeemed for 1 point"),
  ).toBeOnTheScreen();
  expect(screen.queryByText("not-a-date")).toBeNull();
});
