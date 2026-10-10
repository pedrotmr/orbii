import { beforeEach, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { useMutation, useQuery } from "convex/react";
import SettingsScreen from "../src/settings/settings-screen";
import { router } from "./support/navigation";

jest.mock("@clerk/expo", () => ({
  useAuth: () => ({ signOut: jest.fn() }),
}));
jest.mock("expo-router", () => ({
  useRouter: () => require("./support/navigation").router,
}));
jest.mock("../src/reminders/daily-reminders-provider", () => ({
  useDailyReminders: () => ({
    preferences: { morning: false, evening: false },
    isLoading: false,
    isSaving: false,
    permissionMessage: null,
    setReminderEnabled: async () => true,
    openSystemSettings: async () => undefined,
  }),
}));
jest.mock("convex/react", () => ({
  useMutation: jest.fn(),
  useQuery: jest.fn(),
}));
jest.mock("../src/settings/capacity/settings-capacity-section", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("../src/settings/timezone/settings-timezone-section", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("../src/settings/account/settings-sign-out-section", () => ({
  __esModule: true,
  default: () => null,
}));

beforeEach(() => {
  jest.mocked(useQuery).mockReturnValue({
    capacity: 2,
    rewardsVisible: false,
    timezone: "America/Sao_Paulo",
    pointsBalance: 0,
  } as never);
  jest
    .mocked(useMutation)
    .mockReturnValue(jest.fn(async () => undefined) as never);
});

test("Settings opens points history while the Rewards tab is hidden", async () => {
  await render(<SettingsScreen />);

  expect(screen.getByRole("switch", { name: "Rewards tab" })).toHaveProperty(
    "props.value",
    false,
  );
  await fireEvent.press(screen.getByRole("button", { name: "Points history" }));

  expect(router.push).toHaveBeenCalledWith("/points-history");
});
