import { beforeEach, expect, jest, test } from "@jest/globals";
import { type Habit } from "@orbii/backend";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";
import { Alert } from "react-native";
import OrbitHabitRow from "../src/orbit/list/orbit-habit-row";

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(async () => undefined),
}));
const habit: Habit = {
  id: "custom-walk",
  name: "Take a walk",
  glyph: "symbol:walk",
  category: "body",
};

beforeEach(() => {
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
});

test("a swipe does not open edit while the remove action is revealed", async () => {
  const onEdit = jest.fn();
  await render(
    <OrbitHabitRow
      habit={habit}
      busy={false}
      first
      last
      onEdit={onEdit}
      onRemove={jest.fn()}
    />,
  );

  const row = screen.getByRole("button", { name: "Edit Take a walk" });
  const swipeable = screen.getByTestId("reanimated-swipeable");

  await fireEvent(row, "pressIn");
  await fireEvent(swipeable, "swipeableOpenStartDrag");
  await fireEvent(swipeable, "swipeableOpen");
  await fireEvent(row, "press");
  expect(onEdit).not.toHaveBeenCalled();
});

test("a regular row tap still opens edit", async () => {
  const onEdit = jest.fn();
  await render(
    <OrbitHabitRow
      habit={habit}
      busy={false}
      first
      last
      onEdit={onEdit}
      onRemove={jest.fn()}
    />,
  );

  const row = screen.getByRole("button", { name: "Edit Take a walk" });
  await fireEvent.press(row);
  expect(onEdit).toHaveBeenCalledWith(habit.id);
});

test("screen reader remove action keeps the confirmation and haptic", async () => {
  const onRemove = jest.fn();
  await render(
    <OrbitHabitRow
      habit={habit}
      busy={false}
      first
      last
      onEdit={jest.fn()}
      onRemove={onRemove}
    />,
  );

  const row = screen.getByRole("button", { name: "Edit Take a walk" });
  expect(row.props.accessibilityActions).toContainEqual({
    name: "remove",
    label: "Remove habit",
  });
  await fireEvent(row, "accessibilityAction", {
    nativeEvent: { actionName: "remove" },
  });

  expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  expect(Alert.alert).toHaveBeenCalledWith(
    "Remove habit?",
    "Remove “Take a walk” from your Orbit? This can’t be undone.",
    expect.any(Array),
  );
  const buttons = jest.mocked(Alert.alert).mock.lastCall?.[2];
  await act(() =>
    buttons?.find((button) => button.text === "Remove")?.onPress?.(),
  );
  expect(onRemove).toHaveBeenCalledWith(habit.id);
});
