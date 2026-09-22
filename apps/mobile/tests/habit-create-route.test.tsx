import { beforeEach, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { useMutation } from "convex/react";
import { randomUUID } from "expo-crypto";
import HabitCreateRoute from "../app/habit-create";
import { navigatedBack, resetNavigation } from "./support/navigation";

jest.mock("expo-router", () => ({
  useRouter: () => require("./support/navigation").router,
  usePreventRemove: require("./support/navigation").usePreventRemove,
}));
jest.mock("@orbii/backend", () => ({ api: { habits: { add: "habits:add" } } }));
jest.mock("expo-crypto", () => ({ randomUUID: jest.fn() }));
jest.mock("convex/react", () => ({
  useMutation: jest.fn(),
  Authenticated: require("react").Fragment,
  AuthLoading: () => null,
  Unauthenticated: () => null,
}));
jest.mock("../src/components/ensure-user-gate", () => ({
  __esModule: true,
  default: require("react").Fragment,
}));

beforeEach(resetNavigation);

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
