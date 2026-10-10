import { expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import type { ActiveReward } from "../src/rewards/rewards-types";
import RewardCard from "../src/rewards/rewards-screen/reward-card";

test("reward card shows shared-balance progress, eligibility, and edit actions", async () => {
  const onEdit = jest.fn();
  const onDelete = jest.fn();
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
});
