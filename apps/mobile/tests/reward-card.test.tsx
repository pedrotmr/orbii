import { expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import type { ActiveReward } from "../src/rewards/rewards-types";
import RewardCard from "../src/rewards/rewards-screen/reward-card";

test("reward card shows shared-balance progress, eligibility, and edit actions", async () => {
  const onEdit = jest.fn();
  const onDelete = jest.fn();
  const onRedeem = jest.fn();
  const reward: ActiveReward = {
    id: "reward-id" as ActiveReward["id"],
    name: "Quiet Saturday",
    cost: 380,
    pointsProgress: 245,
    pointsRemaining: 135,
    isEligible: false,
  };

  await render(
    <RewardCard
      reward={reward}
      busy={false}
      onEdit={onEdit}
      onDelete={onDelete}
      onRedeem={onRedeem}
    />,
  );

  expect(screen.getByText("245 / 380 pts")).toBeOnTheScreen();
  expect(screen.getByText("135 pts to go")).toBeOnTheScreen();
  expect(
    screen.getByRole("progressbar", { name: "Quiet Saturday progress" }).props
      .accessibilityValue,
  ).toEqual({ min: 0, max: 100, now: 64 });

  await fireEvent.press(
    screen.getByRole("button", { name: "Edit Quiet Saturday" }),
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Delete Quiet Saturday" }),
  );

  expect(onEdit).toHaveBeenCalledTimes(1);
  expect(onDelete).toHaveBeenCalledTimes(1);
  expect(
    screen.getByRole("button", {
      name: "Redeem Quiet Saturday for 380 points",
    }),
  ).toBeDisabled();
  expect(onRedeem).not.toHaveBeenCalled();
});

test("eligible rewards expose a redemption action", async () => {
  const onRedeem = jest.fn();
  const reward: ActiveReward = {
    id: "reward-id" as ActiveReward["id"],
    name: "Quiet Saturday",
    cost: 200,
    pointsProgress: 200,
    pointsRemaining: 0,
    isEligible: true,
  };

  await render(
    <RewardCard
      reward={reward}
      busy={false}
      onEdit={jest.fn()}
      onDelete={jest.fn()}
      onRedeem={onRedeem}
    />,
  );

  await fireEvent.press(
    screen.getByRole("button", {
      name: "Redeem Quiet Saturday for 200 points",
    }),
  );

  expect(onRedeem).toHaveBeenCalledTimes(1);
});

test("reward card shows zero progress for an invalid zero cost", async () => {
  const reward: ActiveReward = {
    id: "invalid-reward-id" as ActiveReward["id"],
    name: "Invalid imported reward",
    cost: 0,
    pointsProgress: 0,
    pointsRemaining: 0,
    isEligible: false,
  };

  await render(
    <RewardCard
      reward={reward}
      busy={false}
      onEdit={() => undefined}
      onDelete={() => undefined}
    />,
  );

  expect(
    screen.getByRole("progressbar", {
      name: "Invalid imported reward progress",
    }).props.accessibilityValue,
  ).toEqual({ min: 0, max: 100, now: 0 });
});

test("reward card shows the ready-goal label when the balance covers its cost", async () => {
  const reward: ActiveReward = {
    id: "ready-reward-id" as ActiveReward["id"],
    name: "Quiet Saturday",
    cost: 200,
    pointsProgress: 200,
    pointsRemaining: 0,
    isEligible: true,
  };

  await render(
    <RewardCard
      reward={reward}
      busy={false}
      onEdit={() => undefined}
      onDelete={() => undefined}
    />,
  );

  expect(screen.getByText("Enough points for this goal")).toBeOnTheScreen();
});
