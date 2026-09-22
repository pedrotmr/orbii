import { jest } from "@jest/globals";

jest.mock("react-native-reanimated", () => ({
  __esModule: true,
  default: { View: require("react-native").View },
  FadeIn: { duration: () => ({ reduceMotion: () => undefined }) },
  ReduceMotion: { System: "system" },
}));
jest.mock(
  "react-native-safe-area-context",
  () => require("react-native-safe-area-context/jest/mock").default,
);
jest.mock("@expo/ui", () => ({
  Host: require("react-native").View,
  Text: require("react-native").Text,
  Button: require("./native-button").default,
}));
jest.mock("@expo/ui/jetpack-compose/modifiers", () => ({
  fillMaxWidth: jest.fn(),
}));
jest.mock("@expo/ui/swift-ui/modifiers", () => ({ frame: jest.fn() }));
