import { beforeEach, expect, jest, test } from "@jest/globals";
import { api, type Habit } from "@orbii/backend";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useMutation, useQuery } from "convex/react";
import { Alert } from "react-native";
import OrbitScreen from "../src/orbit/orbit-screen";
import { resetNavigation } from "./support/navigation";

jest.mock("@orbii/backend", () => ({
  api: {
    users: { get: "users:get" },
    day: { get: "day:get" },
    habits: {
      list: "habits:list",
      remove: "habits:remove",
      reorder: "habits:reorder",
    },
  },
}));
jest.mock("convex/react", () => ({
  useMutation: jest.fn(),
  useQuery: jest.fn(),
}));
jest.mock("expo-router", () => ({
  useFocusEffect: jest.fn(),
  useRouter: () => require("./support/navigation").router,
}));
jest.mock("../src/local-date", () => ({
  todayLocalInTimezone: () => "2026-10-09",
  useTodayLocal: () => "2026-10-09",
}));
jest.mock("../src/live-activity/use-sync-orbit-live-activity", () => ({
  useSyncOrbitLiveActivity: jest.fn(),
}));
jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(async () => undefined),
}));

const savedHabit: Habit = {
  id: "custom-walk",
  name: "Take a walk",
  glyph: "symbol:walk",
  category: "body",
};

const secondHabit: Habit = {
  id: "custom-read",
  name: "Read a book",
  glyph: "symbol:read",
  category: "learn",
};

const habits = [savedHabit, secondHabit];
const user = { timezone: "UTC" };
const day = {
  session: {
    phase: "idle",
    committedIds: [],
    completedIds: [],
  },
};

let finishRemove: () => void;
let removePromise: Promise<void>;
let removeHabit: jest.Mock<
  (args: { habitKey: string; localDate: string }) => Promise<unknown>
>;
let reorderHabit: jest.Mock<
  (args: { habitKeys: string[] }) => Promise<unknown>
>;

beforeEach(() => {
  resetNavigation();
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
  removePromise = new Promise<void>((resolve) => {
    finishRemove = () => resolve();
  });
  removeHabit = jest.fn(() => removePromise);
  reorderHabit = jest.fn(async () => undefined);

  jest.mocked(useQuery).mockImplementation((reference, ..._args) => {
    if (reference === api.users.get) {
      return user as never;
    }

    if (reference === api.day.get) {
      return day as never;
    }

    return habits as never;
  });
  jest.mocked(useMutation).mockImplementation((reference) => {
    if (reference === api.habits.remove) {
      return removeHabit as never;
    }

    return {
      withOptimisticUpdate: () => reorderHabit,
    } as never;
  });
});

test("a drag finishing during a remove shows feedback and resets the grid", async () => {
  await render(<OrbitScreen />);

  const row = screen.getByRole("button", { name: "Edit Take a walk" });
  await fireEvent(row, "accessibilityAction", {
    nativeEvent: { actionName: "remove" },
  });
  const buttons = jest.mocked(Alert.alert).mock.lastCall?.[2];
  await act(() =>
    buttons?.find((button) => button.text === "Remove")?.onPress?.(),
  );

  expect(removeHabit).toHaveBeenCalledWith({
    habitKey: savedHabit.id,
    localDate: "2026-10-09",
  });

  await fireEvent(screen.getByTestId("sortable-grid"), "dragEnd", {
    data: [secondHabit, savedHabit],
    fromIndex: 0,
    toIndex: 1,
  });

  expect(reorderHabit).not.toHaveBeenCalled();
  expect(
    screen.getByText("Another update is in progress. Try reordering again."),
  ).toBeOnTheScreen();
  expect(
    screen
      .getAllByRole("button", { name: /^Edit / })
      .map((button) => button.props.accessibilityLabel),
  ).toEqual([`Edit ${savedHabit.name}`, `Edit ${secondHabit.name}`]);

  await act(async () => {
    finishRemove();
    await removePromise;
  });
});
