import { jest } from "@jest/globals";

jest.mock("react-native-reanimated", () => ({
  __esModule: true,
  default: {
    View: require("react-native").View,
    ScrollView: require("react-native").ScrollView,
    createAnimatedComponent: (Component: unknown) => Component,
  },
  cancelAnimation: jest.fn(),
  Easing: {
    cubic: jest.fn(),
    out: (easing: unknown) => easing,
  },
  FadeIn: { duration: () => ({ reduceMotion: () => undefined }) },
  ReduceMotion: { System: "system" },
  useAnimatedProps: (updater: () => unknown) => updater(),
  useAnimatedRef: () => ({ current: null }),
  useAnimatedStyle: (updater: () => unknown) => updater(),
  useSharedValue: (value: unknown) => ({ value }),
  withTiming: (value: unknown) => value,
}));
jest.mock("react-native-sortables", () => ({
  __esModule: true,
  default: { Grid: require("./sortable-grid").default },
}));
jest.mock("react-native-gesture-handler/ReanimatedSwipeable", () => ({
  __esModule: true,
  default: require("./reanimated-swipeable").default,
}));
jest.mock(
  "react-native-safe-area-context",
  () => require("react-native-safe-area-context/jest/mock").default,
);
jest.mock("@expo/ui", () => ({
  Host: require("react-native").View,
  Picker: require("./native-picker").default,
  Text: require("react-native").Text,
  Button: require("./native-button").default,
}));
jest.mock("@expo/ui/jetpack-compose/modifiers", () => ({
  fillMaxWidth: jest.fn(),
}));
jest.mock("@expo/ui/swift-ui/modifiers", () => ({ frame: jest.fn() }));
