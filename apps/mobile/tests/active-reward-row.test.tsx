import { expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ActionSheetIOS } from "react-native";
import type { ActiveReward } from "../src/rewards/rewards-types";
import ActiveRewardRow from "../src/rewards/rewards-screen/active/active-reward-row";

const growingReward: ActiveReward = {
  id: "reward-id" as ActiveReward["id"],
  name: "Quiet Saturday",
  cost: 380,
  pointsProgress: 245,
  pointsRemaining: 135,
  isEligible: false,
};

const readyReward: ActiveReward = {
  id: "ready-reward-id" as ActiveReward["id"],
  name: "Quiet Saturday",
  cost: 200,
  pointsProgress: 200,
  pointsRemaining: 0,
  isEligible: true,
};

test("active reward row shows its cost and shared-balance progress", async () => {
  await render(
    <ActiveRewardRow
      reward={growingReward}
      busy={false}
      last
      onEdit={jest.fn()}
      onDelete={jest.fn()}
      onRedeem={jest.fn()}
    />,
  );

  expect(screen.getByLabelText("Quiet Saturday, 380 points")).toBeOnTheScreen();
  expect(screen.getByText("380 pts")).toBeOnTheScreen();
  expect(screen.getByText("135 pts to go")).toBeOnTheScreen();
  expect(
    screen.getByRole("progressbar", { name: "Quiet Saturday progress" }).props
      .accessibilityValue,
  ).toEqual({ min: 0, max: 100, now: 64 });
  expect(screen.queryByRole("button", { name: /^Redeem/ })).toBeNull();
});

test("the options button offers edit and delete in a native action sheet", async () => {
  const onEdit = jest.fn();
  const onDelete = jest.fn();
  const showActionSheet = jest
    .spyOn(ActionSheetIOS, "showActionSheetWithOptions")
    .mockImplementation(() => undefined);

  await render(
    <ActiveRewardRow
      reward={growingReward}
      busy={false}
      last
      onEdit={onEdit}
      onDelete={onDelete}
      onRedeem={jest.fn()}
    />,
  );

  await fireEvent.press(
    screen.getByRole("button", { name: "Edit or delete Quiet Saturday" }),
  );

  expect(showActionSheet).toHaveBeenCalledWith(
    expect.objectContaining({
      title: "Quiet Saturday",
      options: ["Edit reward", "Delete reward", "Cancel"],
      destructiveButtonIndex: 1,
      cancelButtonIndex: 2,
    }),
    expect.any(Function),
  );

  const choose = showActionSheet.mock.lastCall?.[1];
  choose?.(0);
  expect(onEdit).toHaveBeenCalledTimes(1);
  expect(onDelete).not.toHaveBeenCalled();

  choose?.(1);
  expect(onDelete).toHaveBeenCalledTimes(1);

  choose?.(2);
  expect(onEdit).toHaveBeenCalledTimes(1);
  expect(onDelete).toHaveBeenCalledTimes(1);
});

test("a reward the balance covers is marked ready and can be redeemed", async () => {
  const onRedeem = jest.fn();

  await render(
    <ActiveRewardRow
      reward={readyReward}
      busy={false}
      last
      onEdit={jest.fn()}
      onDelete={jest.fn()}
      onRedeem={onRedeem}
    />,
  );

  expect(screen.getByText("Ready")).toBeOnTheScreen();
  expect(screen.queryByText(/to go$/)).toBeNull();

  await fireEvent.press(
    screen.getByRole("button", {
      name: "Redeem Quiet Saturday for 200 points",
    }),
  );

  expect(onRedeem).toHaveBeenCalledTimes(1);
});

test("row actions are disabled while another reward change is saving", async () => {
  const onRedeem = jest.fn();

  await render(
    <ActiveRewardRow
      reward={readyReward}
      busy
      last
      onEdit={jest.fn()}
      onDelete={jest.fn()}
      onRedeem={onRedeem}
    />,
  );

  expect(
    screen.getByRole("button", {
      name: "Redeem Quiet Saturday for 200 points",
    }),
  ).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "Edit or delete Quiet Saturday" }),
  ).toBeDisabled();
});

test("active reward row shows zero progress for an invalid zero cost", async () => {
  const reward: ActiveReward = {
    id: "invalid-reward-id" as ActiveReward["id"],
    name: "Invalid imported reward",
    cost: 0,
    pointsProgress: 0,
    pointsRemaining: 0,
    isEligible: false,
  };

  await render(
    <ActiveRewardRow
      reward={reward}
      busy={false}
      last
      onRedeem={() => undefined}
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
