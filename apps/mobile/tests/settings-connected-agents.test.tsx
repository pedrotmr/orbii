import { beforeEach, expect, jest, test } from "@jest/globals";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { useAction, useQuery } from "convex/react";
import { Alert } from "react-native";
import ConnectedAgentsScreen from "../src/settings/connected-agents/connected-agents-screen";

jest.mock("convex/react", () => ({
  useAction: jest.fn(),
  useQuery: jest.fn(),
}));

const connectionId = "agentConnections:example";
const revokeConnection = jest.fn(async (_args: { connectionId: string }) => ({
  revoked: true,
  providerRevoked: true,
}));
const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);

beforeEach(() => {
  alert.mockClear();
  revokeConnection.mockClear();
  jest.mocked(useQuery).mockReturnValue([
    {
      _id: connectionId,
      clientId: "https://agent.example/metadata.json",
      clientName: "Claude Desktop",
      scopes: ["orbii:read", "orbii:write"],
      connectedAt: 1_800_000_000_000,
      lastSeenAt: 1_800_000_100_000,
    },
  ] as never);
  jest.mocked(useAction).mockReturnValue(revokeConnection as never);
});

test("Connected agents shows each client and its granted scopes", async () => {
  await render(<ConnectedAgentsScreen />);

  expect(await screen.findByText("Claude Desktop")).toBeOnTheScreen();
  expect(
    screen.getByText("https://agent.example/metadata.json"),
  ).toBeOnTheScreen();
  expect(screen.getByText("Read access")).toBeOnTheScreen();
  expect(screen.getByText("Write access")).toBeOnTheScreen();
});

test("Connected agents asks before revoking a connection and calls the owner-scoped action", async () => {
  await render(<ConnectedAgentsScreen />);

  await fireEvent.press(
    screen.getByRole("button", { name: "Revoke access for Claude Desktop" }),
  );
  expect(alert).toHaveBeenCalledWith(
    "Revoke Claude Desktop?",
    expect.any(String),
    expect.any(Array),
  );

  const buttons = alert.mock.calls[0]?.[2];
  const revokeButton = buttons?.find(
    (button) => button.text === "Revoke access",
  );
  await act(async () => {
    revokeButton?.onPress?.();
  });

  await waitFor(() => {
    expect(revokeConnection).toHaveBeenCalledWith({ connectionId });
  });
});
