import { beforeEach, expect, jest, test } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import ConnectedAgentsRoute from "../app/settings/connected-agents";

let mockAuthState: { authenticated: boolean };

jest.mock("convex/react", () => ({
  Authenticated: ({ children }: { children: React.ReactNode }) =>
    mockAuthState.authenticated ? children : null,
  AuthLoading: () => null,
  Unauthenticated: ({ children }: { children: React.ReactNode }) =>
    mockAuthState.authenticated ? null : children,
}));
jest.mock("expo-router", () => ({
  Redirect: ({ href }: { href: string }) => {
    const { createElement } = require("react");
    const { Text } = require("react-native");
    return createElement(Text, { testID: "redirect" }, href);
  },
}));
jest.mock("../src/settings/connected-agents/connected-agents-screen", () => ({
  __esModule: true,
  default: () => {
    const { createElement } = require("react");
    const { Text } = require("react-native");
    return createElement(Text, { testID: "connected-agents-screen" }, "Agents");
  },
}));

beforeEach(() => {
  mockAuthState = { authenticated: false };
});

test("connected agents route redirects unauthenticated users", async () => {
  await render(<ConnectedAgentsRoute />);

  expect(screen.getByTestId("redirect")).toHaveTextContent("/welcome");
  expect(screen.queryByTestId("connected-agents-screen")).toBeNull();
});

test("connected agents route renders for authenticated users", async () => {
  mockAuthState = { authenticated: true };

  await render(<ConnectedAgentsRoute />);

  expect(screen.getByTestId("connected-agents-screen")).toBeOnTheScreen();
  expect(screen.queryByTestId("redirect")).toBeNull();
});
