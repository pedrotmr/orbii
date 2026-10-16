import { beforeEach, expect, jest, test } from "@jest/globals";
import { api } from "@orbii/backend";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { useMutation, useQuery } from "convex/react";
import {
  isOrbitLiveActivitySupported,
  startOrbitLiveActivity,
} from "../src/live-activity/orbit-live-activity";
import TodayScreen from "../src/today/today-screen";

jest.mock("@orbii/backend", () => ({
  api: {
    users: { get: "users:get" },
    day: {
      get: "day:get",
      startRevealMutation: "day:startRevealMutation",
      toggleSelect: "day:toggleSelect",
      commit: "day:commit",
      toggleComplete: "day:toggleComplete",
      rereveal: "day:rereveal",
    },
    habits: { list: "habits:list" },
  },
}));
jest.mock("convex/react", () => ({
  useMutation: jest.fn(),
  useQuery: jest.fn(),
}));
jest.mock("../src/local-date", () => ({
  todayLocalInTimezone: () => "2026-10-09",
  useTodayLocal: () => "2026-10-09",
}));
jest.mock("../src/today/states/today-empty-orbit", () => ({
  default: function MockTodayEmptyOrbit() {
    return null;
  },
}));
jest.mock("../src/live-activity/use-sync-orbit-live-activity", () => ({
  useSyncOrbitLiveActivity: jest.fn(),
}));
jest.mock("../src/live-activity/orbit-live-activity", () => ({
  isOrbitLiveActivitySupported: jest.fn(),
  startOrbitLiveActivity: jest.fn(),
}));

const habit = {
  id: "habit-1",
  name: "Read",
  glyph: "symbol:book",
  category: "learn",
  pointValue: 20,
};
const user = { timezone: "UTC" };
let availableHabits = [habit];
const day = {
  capacity: 2,
  streak: 3,
  daysCompleted: 7,
  earnedPoints: 40,
  session: {
    phase: "complete",
    selectedIds: [],
    offeredIds: [],
    committedIds: [habit.id],
    completedIds: [habit.id],
    committedPointValues: [{ habitId: habit.id, points: 20 }],
    committedHabitSnapshots: [] as {
      habitId: string;
      name: string;
      glyph: string;
    }[],
  },
};

const toggleComplete = jest.fn(
  async (_args: { localDate: string; habitId: string }) => undefined,
);

beforeEach(() => {
  availableHabits = [habit];
  day.session.committedHabitSnapshots = [];
  toggleComplete.mockClear();
  jest.mocked(isOrbitLiveActivitySupported).mockClear();
  jest.mocked(isOrbitLiveActivitySupported).mockResolvedValue(true);
  jest.mocked(startOrbitLiveActivity).mockClear();
  jest.mocked(startOrbitLiveActivity).mockResolvedValue(true);

  jest.mocked(useQuery).mockImplementation((reference, ..._args) => {
    if (reference === api.users.get) {
      return user as never;
    }

    if (reference === api.day.get) {
      return day as never;
    }

    return availableHabits as never;
  });
  jest.mocked(useMutation).mockImplementation((reference) => {
    if (reference === api.day.toggleComplete) {
      return toggleComplete as never;
    }

    return jest.fn(async () => undefined) as never;
  });
});

test("unchecking a completed habit restarts the active Live Activity state", async () => {
  await render(<TodayScreen />);

  await fireEvent.press(
    screen.getByRole("checkbox", { name: "Read, 20 points" }),
  );

  await waitFor(() => {
    expect(toggleComplete).toHaveBeenCalledWith({
      localDate: "2026-10-09",
      habitId: habit.id,
    });
    expect(startOrbitLiveActivity).toHaveBeenCalledTimes(1);
  });

  const [content] = jest.mocked(startOrbitLiveActivity).mock.calls[0] ?? [];

  expect(content).toMatchObject({
    localDate: "2026-10-09",
    phase: "active",
    completedCount: 0,
    totalCount: 1,
    habits: [{ id: habit.id, isComplete: false }],
  });
});

test("a removed completed habit remains available for undo from its snapshot", async () => {
  availableHabits = [];
  day.session.committedHabitSnapshots = [
    { habitId: habit.id, name: habit.name, glyph: habit.glyph },
  ];

  await render(<TodayScreen />);

  await fireEvent.press(
    screen.getByRole("checkbox", { name: "Read, 20 points" }),
  );

  await waitFor(() => {
    expect(toggleComplete).toHaveBeenCalledWith({
      localDate: "2026-10-09",
      habitId: habit.id,
    });
    expect(startOrbitLiveActivity).toHaveBeenCalledTimes(1);
  });
});
