import { beforeEach, expect, jest, test } from "@jest/globals";
import { type Habit } from "@orbii/backend";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { useMutation, useQuery } from "convex/react";
import { randomUUID } from "expo-crypto";
import { useLocalSearchParams } from "expo-router";
import HabitCreateRoute from "../app/habit-create";
import { navigatedBack, resetNavigation } from "./support/navigation";

jest.mock("expo-router", () => ({
  useRouter: () => require("./support/navigation").router,
  useLocalSearchParams: jest.fn(() => ({})),
  usePreventRemove: require("./support/navigation").usePreventRemove,
}));
jest.mock("@orbii/backend", () => ({
  api: {
    habits: { add: "habits:add", update: "habits:update", list: "habits:list" },
  },
}));
jest.mock("expo-crypto", () => ({ randomUUID: jest.fn() }));
jest.mock("convex/react", () => ({
  useMutation: jest.fn(),
  useQuery: jest.fn(),
  Authenticated: require("react").Fragment,
  AuthLoading: () => null,
  Unauthenticated: () => null,
}));
jest.mock("../src/components/ensure-user-gate", () => ({
  __esModule: true,
  default: require("react").Fragment,
}));

beforeEach(() => {
  resetNavigation();
  jest.mocked(useLocalSearchParams).mockReturnValue({});
  jest.mocked(useQuery).mockReturnValue(undefined as never);
});

test("retry keeps the same habit key and payload, while a new creation gets a new key", async () => {
  const add = jest
    .fn<(...args: unknown[]) => Promise<unknown>>()
    .mockRejectedValueOnce(new Error("Connection lost"))
    .mockResolvedValue("habit-id");
  jest
    .mocked(useMutation)
    .mockReturnValue(add as unknown as ReturnType<typeof useMutation>);
  jest
    .mocked(randomUUID)
    .mockReturnValueOnce("00000000-0000-4000-8000-000000000001")
    .mockReturnValueOnce("00000000-0000-4000-8000-000000000002");
  const first = await render(<HabitCreateRoute />);
  await fireEvent.changeText(
    screen.getByLabelText("Habit name"),
    "Take a cold shower",
  );
  await fireEvent.press(screen.getByRole("button", { name: "Add to Orbit" }));
  expect(screen.getByText(/We couldn’t add your habit/)).toBeOnTheScreen();
  expect(navigatedBack).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole("button", { name: "Add to Orbit" }));
  expect(add).toHaveBeenCalledTimes(2);
  expect(add.mock.calls[0]).toEqual([
    {
      habitKey: "custom-00000000-0000-4000-8000-000000000001",
      name: "Take a cold shower",
      glyph: "symbol:cold",
      category: "body",
    },
  ]);
  expect(add.mock.calls[1]).toEqual(add.mock.calls[0]);
  expect(navigatedBack).toHaveBeenCalledTimes(1);
  await first.unmount();
  await render(<HabitCreateRoute />);
  await fireEvent.changeText(
    screen.getByLabelText("Habit name"),
    "Practice Spanish",
  );
  await fireEvent.press(screen.getByRole("button", { name: "Add to Orbit" }));
  expect(add).toHaveBeenLastCalledWith({
    habitKey: "custom-00000000-0000-4000-8000-000000000002",
    name: "Practice Spanish",
    glyph: "symbol:language",
    category: "learn",
  });
});

test("an Orbit habit opens prefilled and saves through the update mutation", async () => {
  const habit: Habit = {
    id: "custom-cold-shower",
    name: "Take a cold shower",
    glyph: "symbol:cold",
    category: "body",
  };
  const update = jest.fn<(...args: unknown[]) => Promise<unknown>>();
  jest.mocked(useLocalSearchParams).mockReturnValue({
    habitKey: habit.id,
  } as never);
  jest.mocked(useQuery).mockReturnValue([habit] as never);
  jest
    .mocked(useMutation)
    .mockReturnValue(update as unknown as ReturnType<typeof useMutation>);

  await render(<HabitCreateRoute />);

  expect(screen.getByText("Edit habit")).toBeOnTheScreen();
  expect(screen.getByDisplayValue(habit.name)).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();
  await fireEvent.changeText(
    screen.getByLabelText("Habit name"),
    "Take a walk",
  );
  await fireEvent.press(screen.getByRole("button", { name: "Save changes" }));

  expect(update).toHaveBeenCalledWith({
    habitKey: habit.id,
    name: "Take a walk",
    glyph: habit.glyph,
    category: habit.category,
  });
  expect(navigatedBack).toHaveBeenCalledTimes(1);
});

test("an unknown habit key cannot fall through to the create form", async () => {
  jest.mocked(useLocalSearchParams).mockReturnValue({
    habitKey: "missing",
  } as never);
  jest.mocked(useQuery).mockReturnValue([] as never);

  await render(<HabitCreateRoute />);

  expect(
    screen.getByText("We couldn’t find that habit in your Orbit."),
  ).toBeOnTheScreen();
  expect(screen.queryByRole("button", { name: "Add to Orbit" })).toBeNull();
});
