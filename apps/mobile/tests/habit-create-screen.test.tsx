import { beforeEach, expect, jest, test } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Alert } from "react-native";
import HabitCreateScreen from "../src/habits/create/habit-create-screen";
import { deferred } from "./support/deferred";
import {
  disablePrevention,
  navigatedBack,
  requestRemoval,
  resetNavigation,
  router,
} from "./support/navigation";

jest.mock("expo-router", () => ({
  useRouter: () => require("./support/navigation").router,
  usePreventRemove: require("./support/navigation").usePreventRemove,
}));

beforeEach(() => {
  resetNavigation();
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
});

const enterName = async (name: string) => {
  await fireEvent.changeText(screen.getByLabelText("Habit name"), name);
};
const press = async (name: string | RegExp) => {
  await fireEvent.press(screen.getByRole("button", { name }));
};
const answerDiscard = async (text: string) => {
  const buttons = jest.mocked(Alert.alert).mock.lastCall?.[2];
  const button = buttons?.find((item) => item.text === text);
  expect(button).toBeDefined();
  await act(() => button?.onPress?.());
};

test("blank names cannot submit from the button or keyboard", async () => {
  const save = jest.fn(async () => {});
  await render(<HabitCreateScreen onSave={save} />);
  await enterName("   ");
  expect(screen.getByRole("button", { name: "Add to Orbit" })).toBeDisabled();
  await fireEvent(screen.getByLabelText("Habit name"), "submitEditing");
  expect(save).not.toHaveBeenCalled();
});

test("saving sends the trimmed name and suggested symbol, and only closes after success", async () => {
  const pending = deferred();
  const save = jest.fn(() => pending.promise);
  await render(<HabitCreateScreen onSave={save} />);
  await enterName("  Take a cold shower  ");
  await press("Add to Orbit");
  expect(save).toHaveBeenCalledWith({
    name: "Take a cold shower",
    glyph: "symbol:cold",
    category: "body",
  });
  expect(screen.getByRole("button", { name: "Adding…" })).toBeDisabled();
  expect(navigatedBack).not.toHaveBeenCalled();
  await act(() => pending.resolve());
  expect(disablePrevention).toHaveBeenCalledTimes(1);
  expect(navigatedBack).toHaveBeenCalledTimes(1);
  expect(Alert.alert).not.toHaveBeenCalled();
});

test("rapid submissions and removal while saving cannot duplicate or abandon a request", async () => {
  const pending = deferred();
  const save = jest.fn(() => pending.promise);
  await render(<HabitCreateScreen onSave={save} />);
  await enterName("Practice Spanish");
  const input = screen.getByLabelText("Habit name");
  // Two queued events reach the handler before a disabled control can rerender.
  await act(() => {
    input.props.onSubmitEditing();
    input.props.onSubmitEditing();
  });
  await act(requestRemoval);
  expect(save).toHaveBeenCalledTimes(1);
  expect(navigatedBack).not.toHaveBeenCalled();
  expect(Alert.alert).not.toHaveBeenCalled();
  await act(() => pending.resolve());
  expect(navigatedBack).toHaveBeenCalledTimes(1);
});

test("a failed save keeps the draft, displays an error, and can retry", async () => {
  const save = jest
    .fn<() => Promise<unknown>>()
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce(undefined);
  await render(<HabitCreateScreen onSave={save} />);
  await enterName("Practice Spanish");
  await press("Add to Orbit");
  expect(screen.getByText(/We couldn’t add your habit/)).toBeOnTheScreen();
  expect(screen.getByDisplayValue("Practice Spanish")).toBeOnTheScreen();
  expect(
    screen.getByRole("button", { name: "Change icon, Language" }),
  ).toBeOnTheScreen();
  expect(navigatedBack).not.toHaveBeenCalled();
  await press("Add to Orbit");
  expect(save).toHaveBeenCalledTimes(2);
  expect(save.mock.calls[0]).toEqual(save.mock.calls[1]);
  expect(screen.queryByText(/We couldn’t add your habit/)).toBeNull();
  expect(navigatedBack).toHaveBeenCalledTimes(1);
});

test("manual icon and category choices survive renaming and are saved", async () => {
  const save = jest.fn(async () => {});
  await render(<HabitCreateScreen onSave={save} />);
  await enterName("Take a cold shower");
  await press("Change icon, Cold shower");
  await fireEvent.changeText(screen.getByLabelText("Search symbols"), "piano");
  await fireEvent.press(screen.getByRole("radio", { name: "Piano" }));
  await press("Use icon");
  await fireEvent.press(screen.getByRole("radio", { name: "mind" }));
  await enterName("Drink water");
  expect(
    screen.getByRole("button", { name: "Change icon, Piano" }),
  ).toBeOnTheScreen();
  expect(screen.getByRole("radio", { name: "mind" })).toBeChecked();
  await press("Add to Orbit");
  expect(save).toHaveBeenCalledWith({
    name: "Drink water",
    glyph: "symbol:piano",
    category: "mind",
  });
});

test("backing out of the picker discards its pending choice and keeps the form", async () => {
  await render(<HabitCreateScreen onSave={jest.fn(async () => {})} />);
  await enterName("Read a little");
  await press("Change icon, Read");
  await fireEvent.press(screen.getByRole("radio", { name: "Walk" }));
  await press("Back to habit");
  expect(screen.getByDisplayValue("Read a little")).toBeOnTheScreen();
  expect(
    screen.getByRole("button", { name: "Change icon, Read" }),
  ).toBeOnTheScreen();
  await press("Change icon, Read");
  expect(screen.getByRole("radio", { name: "Read" })).toBeChecked();
  await act(requestRemoval);
  expect(screen.getByDisplayValue("Read a little")).toBeOnTheScreen();
  expect(navigatedBack).not.toHaveBeenCalled();
  expect(Alert.alert).not.toHaveBeenCalled();
});

test("an untouched form closes without a discard prompt", async () => {
  await render(<HabitCreateScreen onSave={jest.fn(async () => {})} />);
  await press("Close habit creation");
  expect(navigatedBack).toHaveBeenCalledTimes(1);
  expect(Alert.alert).not.toHaveBeenCalled();
});

test("dirty form removal can keep the draft or discard it without saving", async () => {
  const save = jest.fn(async () => {});
  await render(<HabitCreateScreen onSave={save} />);
  await enterName("Read a little");
  await press("Close habit creation");
  expect(Alert.alert).toHaveBeenCalledWith(
    "Discard this habit?",
    expect.any(String),
    expect.any(Array),
  );
  await answerDiscard("Keep editing");
  expect(screen.getByDisplayValue("Read a little")).toBeOnTheScreen();
  expect(navigatedBack).not.toHaveBeenCalled();
  await act(requestRemoval);
  await answerDiscard("Discard");
  expect(navigatedBack).toHaveBeenCalledTimes(1);
  expect(save).not.toHaveBeenCalled();
});

test("changing only the category also protects the draft", async () => {
  await render(<HabitCreateScreen onSave={jest.fn(async () => {})} />);
  await fireEvent.press(screen.getByRole("radio", { name: "mind" }));
  await press("Close habit creation");
  expect(Alert.alert).toHaveBeenCalled();
  expect(navigatedBack).not.toHaveBeenCalled();
});

test("successful creation opened without navigation history returns to the app", async () => {
  router.canGoBack.mockReturnValue(false);
  await render(<HabitCreateScreen onSave={jest.fn(async () => {})} />);
  await enterName("Read");
  await press("Add to Orbit");
  expect(router.replace).toHaveBeenCalledWith("/");
});
