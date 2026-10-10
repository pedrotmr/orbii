import { expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import RewardForm from "../src/rewards/rewards-screen/reward-form";

test("point cost filters pasted non-digits", async () => {
  await render(
    <RewardForm
      draft={{ name: "A day off", cost: "" }}
      busy={false}
      error={null}
      onCancel={jest.fn()}
      onSave={jest.fn()}
    />,
  );

  const input = screen.getByLabelText("Point cost");
  await fireEvent.changeText(input, "1,200 points");

  expect(screen.getByLabelText("Point cost").props.value).toBe("1200");
});
