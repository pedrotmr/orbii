import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import { darkColors } from "@orbii/tokens";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import * as SplashScreen from "expo-splash-screen";
import { AccessibilityInfo } from "react-native";
import * as theme from "../src/theme/use-theme";
import { playAnimation } from "./support/lottie-view";

jest.mock("@clerk/expo", () => ({
  ClerkProvider: require("./support/test-provider").default,
  useAuth: jest.fn(),
}));
jest.mock("@clerk/expo/token-cache", () => ({ tokenCache: {} }));
jest.mock("convex/react-clerk", () => ({
  ConvexProviderWithClerk: require("./support/test-provider").default,
}));
jest.mock("../src/convexClient", () => ({ convex: {} }));
jest.mock("../src/discard-slice-identity", () => ({
  discardSliceClientUserId: jest.fn(),
}));
jest.mock("expo-router", () => ({
  Stack: Object.assign(require("react-native").View, { Screen: () => null }),
  ThemeProvider: require("./support/test-provider").default,
  DefaultTheme: { colors: {} },
  DarkTheme: { colors: {} },
}));
jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn<() => Promise<void>>().mockResolvedValue(),
  hideAsync: jest.fn<() => Promise<void>>().mockResolvedValue(),
}));
jest.mock("lottie-react-native", () => ({
  __esModule: true,
  default: require("./support/lottie-view").default,
}));
jest.mock("react-native-gesture-handler", () => ({
  GestureHandlerRootView: require("react-native").View,
}));

beforeEach(() => {
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_launch_regression";
  jest
    .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
    .mockResolvedValue(false);
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

test("app startup mounts the launch animation before hiding the native splash", async () => {
  const RootLayout = require("../app/_layout").default;
  await render(<RootLayout />);

  expect(screen.getByTestId("launch-animation")).toBeOnTheScreen();
  expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  expect(playAnimation).not.toHaveBeenCalled();

  await fireEvent(screen.getByTestId("launch-screen"), "layout");
  expect(SplashScreen.hideAsync).not.toHaveBeenCalled();

  await fireEvent(screen.getByTestId("launch-animation"), "animationLoaded");
  expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
  expect(playAnimation).toHaveBeenCalledTimes(1);

  await fireEvent(
    screen.getByTestId("launch-animation"),
    "animationFinish",
    false,
  );
  expect(screen.queryByTestId("launch-animation")).toBeNull();
});

test("player loads while motion preference is pending without starting playback", async () => {
  let resolveMotion: (enabled: boolean) => void = () => undefined;
  const preference = new Promise<boolean>((resolve) => {
    resolveMotion = resolve;
  });
  jest
    .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
    .mockReturnValue(preference);
  const RootLayout = require("../app/_layout").default;
  await render(<RootLayout />);

  const animation = screen.getByTestId("launch-animation");
  expect(animation.props.autoPlay).toBe(false);
  await fireEvent(screen.getByTestId("launch-screen"), "layout");
  await fireEvent(animation, "layout");
  expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  expect(playAnimation).not.toHaveBeenCalled();

  await act(async () => {
    resolveMotion(false);
  });
  expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
  expect(playAnimation).toHaveBeenCalledTimes(1);
});

test("pending motion preference can resolve to reduced motion without playback", async () => {
  let resolveMotion: (enabled: boolean) => void = () => undefined;
  const preference = new Promise<boolean>((resolve) => {
    resolveMotion = resolve;
  });
  jest
    .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
    .mockReturnValue(preference);
  const RootLayout = require("../app/_layout").default;
  await render(<RootLayout />);
  await fireEvent(screen.getByTestId("launch-screen"), "layout");
  await fireEvent(screen.getByTestId("launch-animation"), "layout");

  await act(async () => {
    resolveMotion(true);
  });
  expect(screen.queryByTestId("launch-screen")).toBeNull();
  expect(playAnimation).not.toHaveBeenCalled();
  expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
});

test("reduced motion skips playback and releases the static splash after layout", async () => {
  jest
    .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
    .mockResolvedValue(true);
  const RootLayout = require("../app/_layout").default;
  await render(<RootLayout />);

  expect(screen.queryByTestId("launch-animation")).toBeNull();
  expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  await fireEvent(screen.getByTestId("launch-screen"), "layout");
  expect(screen.queryByTestId("launch-screen")).toBeNull();
  expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
});

test("native player layout starts playback even when its loaded event is missing", async () => {
  const RootLayout = require("../app/_layout").default;
  await render(<RootLayout />);
  await fireEvent(screen.getByTestId("launch-screen"), "layout");
  await fireEvent(screen.getByTestId("launch-animation"), "layout");

  expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
  expect(playAnimation).toHaveBeenCalledTimes(1);
});

test("animation failure releases startup", async () => {
  const RootLayout = require("../app/_layout").default;
  await render(<RootLayout />);
  await fireEvent(
    screen.getByTestId("launch-animation"),
    "animationFailure",
    "invalid animation",
  );

  expect(screen.queryByTestId("launch-screen")).toBeNull();
  expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
});

test("a cancelled playback callback does not dismiss the launch animation", async () => {
  const RootLayout = require("../app/_layout").default;
  await render(<RootLayout />);
  await fireEvent(
    screen.getByTestId("launch-animation"),
    "animationFinish",
    true,
  );

  expect(screen.getByTestId("launch-animation")).toBeOnTheScreen();
});

test("dark appearance plays the dark Lottie artwork", async () => {
  jest
    .spyOn(theme, "useTheme")
    .mockReturnValue({ scheme: "dark", colors: darkColors });
  const RootLayout = require("../app/_layout").default;
  await render(<RootLayout />);

  const animation = screen.getByTestId("launch-animation");
  expect(animation.props.source).toEqual(
    require("../assets/brand/animations/return-loop-splash-dark.json"),
  );
  expect(animation.props.loop).toBe(false);
  expect(animation.props.autoPlay).toBe(false);
});

test("missing native callbacks cannot leave startup stuck", async () => {
  jest.useFakeTimers();
  const RootLayout = require("../app/_layout").default;
  await render(<RootLayout />);
  await act(async () => {
    jest.advanceTimersByTime(3000);
  });

  expect(screen.queryByTestId("launch-screen")).toBeNull();
  expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
});
