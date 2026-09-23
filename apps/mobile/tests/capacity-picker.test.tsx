import { expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import CapacityPicker from "../src/components/controls/capacity-picker";

test("choosing a capacity passes the numeric value to onChange", async () => {
  const onChange = jest.fn();
  await render(<CapacityPicker value={2} onChange={onChange} />);

  expect(
    screen.getByRole("button", { name: "2 habits", selected: true }),
  ).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole("button", { name: "3 habits" }));

  expect(onChange).toHaveBeenCalledWith(3);
});

test("disabled capacity picker prevents interaction", async () => {
  const onChange = jest.fn();
  await render(<CapacityPicker value={2} disabled onChange={onChange} />);
  const option = screen.getByRole("button", { name: "3 habits" });

  expect(option).toBeDisabled();
  await fireEvent.press(option);

  expect(onChange).not.toHaveBeenCalled();
});
