import { beforeEach, expect, jest, test } from "@jest/globals";
import { api } from "@orbii/backend";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { useMutation, useQuery } from "convex/react";
import { completionFeedback } from "../src/components/controls/feedback";
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
jest.mock("../src/components/controls/feedback", () => ({
  completionFeedback: jest.fn(),
  selectionFeedback: jest.fn(),
}));
jest.mock("../src/local-date", () => ({
  isLocalDateReady: () => true,
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
  async (_args: { localDate: string; habitId: string }) => ({
    completedOrbit: false,
  }),
);

beforeEach(() => {
  availableHabits = [habit];
  day.session.phase = "complete";
  day.session.committedIds = [habit.id];
  day.session.completedIds = [habit.id];
  day.session.committedHabitSnapshots = [];
  toggleComplete.mockClear();
  jest.mocked(completionFeedback).mockClear();
  toggleComplete.mockResolvedValue({ completedOrbit: false });
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

test("completion feedback follows the transition returned by Convex", async () => {
  day.session.phase = "active";
  day.session.completedIds = [];
  toggleComplete.mockResolvedValue({ completedOrbit: true });

  await render(<TodayScreen />);
  await fireEvent.press(
    screen.getByRole("checkbox", { name: "Read, 20 points" }),
  );

  await waitFor(() => {
    expect(completionFeedback).toHaveBeenCalledTimes(1);
  });
});

test("completion feedback stays silent when Convex reports no completed Orbit", async () => {
  day.session.phase = "active";
  day.session.completedIds = [];
  let resolveToggleComplete:
    ((result: { completedOrbit: boolean }) => void) | undefined;
  toggleComplete.mockReturnValue(
    new Promise((resolve) => {
      resolveToggleComplete = resolve;
    }),
  );

  await render(<TodayScreen />);
  await fireEvent.press(
    screen.getByRole("checkbox", { name: "Read, 20 points" }),
  );
  await waitFor(() => {
    expect(toggleComplete).toHaveBeenCalledTimes(1);
  });

  resolveToggleComplete?.({ completedOrbit: false });

  await waitFor(() => {
    expect(
      screen.getByRole("checkbox", { name: "Read, 20 points" }).props
        .accessibilityState?.disabled,
    ).toBe(false);
  });
  expect(completionFeedback).not.toHaveBeenCalled();
});

test("legacy null responses still signal completion after the final checkoff", async () => {
  day.session.phase = "active";
  day.session.completedIds = [];
  toggleComplete.mockResolvedValue(null as never);

  await render(<TodayScreen />);
  await fireEvent.press(
    screen.getByRole("checkbox", { name: "Read, 20 points" }),
  );

  await waitFor(() => {
    expect(completionFeedback).toHaveBeenCalledTimes(1);
  });
});

test("legacy null responses stay silent when unchecking a completed habit", async () => {
  day.session.phase = "active";
  day.session.committedIds = [habit.id, "habit-2"];
  day.session.completedIds = [habit.id];
  toggleComplete.mockResolvedValue(null as never);

  await render(<TodayScreen />);
  await fireEvent.press(
    screen.getByRole("checkbox", { name: "Read, 20 points" }),
  );

  await waitFor(() => {
    expect(toggleComplete).toHaveBeenCalledTimes(1);
  });
  await waitFor(() => {
    expect(
      screen.getByRole("checkbox", { name: "Read, 20 points" }).props
        .accessibilityState?.disabled,
    ).toBe(false);
  });
  expect(completionFeedback).not.toHaveBeenCalled();
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
