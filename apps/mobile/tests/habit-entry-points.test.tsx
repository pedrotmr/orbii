import { expect, jest, test } from "@jest/globals";
import { type Habit } from "@orbii/backend";
import { fireEvent, render, screen } from "@testing-library/react-native";
import OrbitContent from "../src/orbit/body/orbit-content";
import SetupSeedAddStep from "../src/setup/seed-add/setup-seed-add-step";
import { router } from "./support/navigation";

jest.mock("expo-router", () => ({
  useRouter: () => require("./support/navigation").router,
}));
jest.mock("convex/react", () => ({ useMutation: () => jest.fn() }));
jest.mock("react-native-screens/experimental", () => ({
  SafeAreaView: require("react-native").View,
}));

const savedHabit: Habit = {
  id: "custom-cold-shower",
  name: "Take a cold shower",
  glyph: "symbol:cold",
  category: "body",
};

test("Orbit opens the creation sheet and displays a newly received habit", async () => {
  const remove = jest.fn();
  const view = await render(
    <OrbitContent habits={[]} busy={false} error={null} onRemove={remove} />,
  );
  await fireEvent.press(screen.getByRole("button", { name: "Add habit" }));
  expect(router.push).toHaveBeenCalledWith("/habit-create");
  expect(remove).not.toHaveBeenCalled();
  await view.rerender(
    <OrbitContent
      habits={[savedHabit]}
      busy={false}
      error={null}
      onRemove={remove}
    />,
  );
  expect(screen.getByText("Take a cold shower")).toBeOnTheScreen();
  expect(screen.getByText("1 habit")).toBeOnTheScreen();
});

test("onboarding opens the same sheet and can continue only after receiving a saved habit", async () => {
  const proceed = jest.fn();
  const run = jest.fn(async () => {});
  const view = await render(
    <SetupSeedAddStep
      habits={[]}
      busy={false}
      onContinue={proceed}
      run={run}
    />,
  );
  expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  await fireEvent.press(screen.getByRole("button", { name: "Create a habit" }));
  expect(router.push).toHaveBeenCalledWith("/habit-create");
  expect(run).not.toHaveBeenCalled();
  expect(proceed).not.toHaveBeenCalled();
  await view.rerender(
    <SetupSeedAddStep
      habits={[savedHabit]}
      busy={false}
      onContinue={proceed}
      run={run}
    />,
  );
  expect(screen.getByText(/1 habit is in your Orbit/)).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  await fireEvent.press(screen.getByRole("button", { name: "Continue" }));
  expect(proceed).toHaveBeenCalledTimes(1);
});

test("both entry points prevent opening a new sheet while their parent is busy", async () => {
  const orbit = await render(
    <OrbitContent habits={[]} busy error={null} onRemove={jest.fn()} />,
  );
  expect(screen.getByRole("button", { name: "Add habit" })).toBeDisabled();
  await fireEvent.press(screen.getByRole("button", { name: "Add habit" }));
  await orbit.unmount();
  await render(
    <SetupSeedAddStep
      habits={[]}
      busy
      onContinue={jest.fn()}
      run={jest.fn(async () => {})}
    />,
  );
  expect(screen.getByRole("button", { name: "Create a habit" })).toBeDisabled();
  await fireEvent.press(screen.getByRole("button", { name: "Create a habit" }));
  expect(router.push).not.toHaveBeenCalled();
});
