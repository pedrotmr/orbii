import { beforeEach, expect, jest, test } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { useMutation, useQuery } from "convex/react";
import { Appearance } from "react-native";
import SettingsScreen from "../src/settings/settings-screen";
import ThemePreferenceProvider from "../src/theme/theme-preference-provider";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

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

const setColorScheme = jest.spyOn(Appearance, "setColorScheme");

beforeEach(async () => {
  await AsyncStorage.clear();
  setColorScheme.mockClear();
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

test("Settings applies and saves the selected theme", async () => {
  await render(
    <ThemePreferenceProvider>
      <SettingsScreen />
    </ThemePreferenceProvider>,
  );

  expect(await screen.findByRole("radio", { name: "System" })).toHaveProperty(
    "props.accessibilityState.checked",
    true,
  );
  await fireEvent.press(screen.getByRole("radio", { name: "Dark" }));

  await waitFor(async () => {
    expect(await AsyncStorage.getItem("@orbii/theme-preference/v1")).toBe(
      "dark",
    );
  });
  expect(screen.getByRole("radio", { name: "Dark" })).toHaveProperty(
    "props.accessibilityState.checked",
    true,
  );
  expect(setColorScheme).toHaveBeenCalledWith("dark");
});

test("Settings keeps the current theme when saving the selection fails", async () => {
  jest
    .mocked(AsyncStorage.setItem)
    .mockRejectedValueOnce(new Error("Storage failed"));

  await render(
    <ThemePreferenceProvider>
      <SettingsScreen />
    </ThemePreferenceProvider>,
  );

  await fireEvent.press(await screen.findByRole("radio", { name: "Dark" }));
  expect(await screen.findByText("Storage failed")).toBeOnTheScreen();
  expect(screen.getByRole("radio", { name: "System" })).toHaveProperty(
    "props.accessibilityState.checked",
    true,
  );
  expect(screen.getByRole("radio", { name: "Dark" })).toHaveProperty(
    "props.accessibilityState.checked",
    false,
  );
  expect(setColorScheme).not.toHaveBeenCalledWith("dark");
});

test("Settings loads a saved theme preference", async () => {
  await AsyncStorage.setItem("@orbii/theme-preference/v1", "light");
  await render(
    <ThemePreferenceProvider>
      <SettingsScreen />
    </ThemePreferenceProvider>,
  );

  await waitFor(() => {
    expect(screen.getByRole("radio", { name: "Light" })).toHaveProperty(
      "props.accessibilityState.checked",
      true,
    );
  });
  expect(setColorScheme).toHaveBeenCalledWith("light");
});
