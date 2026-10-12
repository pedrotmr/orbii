import { expect, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { useState } from "react";
import HabitPointValuePicker from "../src/habits/create/form/habit-point-value-picker";

interface HabitPointValuePickerHarnessProps {
  initialValue: string;
}

function HabitPointValuePickerHarness({
  initialValue,
}: HabitPointValuePickerHarnessProps) {
  const [value, setValue] = useState(initialValue);
  return (
    <HabitPointValuePicker value={value} disabled={false} onChange={setValue} />
  );
}

test.each(["10", "20", "30"])(
  "keeps custom preset-like value %s visible while editing",
  async (value) => {
    await render(<HabitPointValuePickerHarness initialValue="47" />);
    const input = screen.getByLabelText("Custom point value");

    await fireEvent(input, "focus");
    await fireEvent.changeText(input, value);

    expect(screen.getByDisplayValue(value)).toBeOnTheScreen();
  },
);

test("hides the selected preset from the custom input after blur", async () => {
  await render(<HabitPointValuePickerHarness initialValue="47" />);
  const input = screen.getByLabelText("Custom point value");

  await fireEvent(input, "focus");
  await fireEvent.changeText(input, "10");
  await fireEvent.press(screen.getByRole("radio", { name: "Hard 30" }));

  expect(
    screen.getByRole("radio", { name: "Hard 30", checked: true }),
  ).toBeOnTheScreen();
  expect(screen.getByDisplayValue("30")).toBeOnTheScreen();

  await fireEvent(input, "blur");

  expect(screen.getByLabelText("Custom point value").props.value).toBe("");
  expect(
    screen.getByRole("radio", { name: "Hard 30", checked: true }),
  ).toBeOnTheScreen();
});
