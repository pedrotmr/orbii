import { expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import WelcomeContent from "../src/auth/welcome/welcome-content";

test("welcome offers only Apple and Google sign-in", async () => {
  const onSignIn = jest.fn();
  await render(
    <WelcomeContent pendingProvider={null} error={null} onSignIn={onSignIn} />,
  );

  expect(screen.getAllByRole("button")).toHaveLength(2);
  expect(screen.queryByText(/email/i)).toBeNull();
  expect(screen.queryByText(/every device/i)).toBeNull();

  await fireEvent.press(
    screen.getByRole("button", { name: "Continue with Apple" }),
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Continue with Google" }),
  );
  expect(onSignIn.mock.calls).toEqual([["apple"], ["google"]]);
});

test("a pending sign-in disables both buttons and keeps the error visible", async () => {
  const onSignIn = jest.fn();
  await render(
    <WelcomeContent
      pendingProvider="google"
      error="Sign-in failed"
      onSignIn={onSignIn}
    />,
  );

  const apple = screen.getByRole("button", { name: "Continue with Apple" });
  const google = screen.getByRole("button", { name: "Continue with Google" });
  expect(apple).toBeDisabled();
  expect(google).toBeDisabled();
  expect(google).toBeBusy();
  expect(apple).not.toBeBusy();
  expect(screen.getByText("Sign-in failed")).toBeOnTheScreen();

  await fireEvent.press(apple);
  expect(onSignIn).not.toHaveBeenCalled();
});
