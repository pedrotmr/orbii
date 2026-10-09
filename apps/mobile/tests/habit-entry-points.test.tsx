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

const secondHabit: Habit = {
  id: "custom-read",
  name: "Read a book",
  glyph: "symbol:read",
  category: "learn",
};

test("Orbit opens the creation sheet and displays a newly received habit", async () => {
  const remove = jest.fn();
  const reorder = jest.fn();
  const view = await render(
    <OrbitContent
      habits={[]}
      busy={false}
      error={null}
      gridResetKey={0}
      onRemove={remove}
      onReorder={reorder}
    />,
  );
  await fireEvent.press(screen.getByRole("button", { name: "Add habit" }));
  expect(router.push).toHaveBeenCalledWith("/habit-create");
  expect(remove).not.toHaveBeenCalled();
  await view.rerender(
    <OrbitContent
      habits={[savedHabit]}
      busy={false}
      error={null}
      gridResetKey={0}
      onRemove={remove}
      onReorder={reorder}
    />,
  );
  expect(screen.getByText("Take a cold shower")).toBeOnTheScreen();
  expect(screen.getByText("1 habit")).toBeOnTheScreen();
  await fireEvent.press(
    screen.getByRole("button", { name: "Edit Take a cold shower" }),
  );
  expect(router.push).toHaveBeenLastCalledWith({
    pathname: "/habit-create",
    params: { habitKey: savedHabit.id },
  });
  expect(reorder).not.toHaveBeenCalled();
});

test("Orbit persists the order returned after a drag", async () => {
  const reorder = jest.fn();
  await render(
    <OrbitContent
      habits={[savedHabit, secondHabit]}
      busy={false}
      error={null}
      gridResetKey={0}
      onRemove={jest.fn()}
      onReorder={reorder}
    />,
  );

  await fireEvent(screen.getByTestId("sortable-grid"), "dragEnd", {
    data: [secondHabit, savedHabit],
    fromIndex: 0,
    toIndex: 1,
  });

  expect(reorder).toHaveBeenCalledWith([secondHabit.id, savedHabit.id]);
});

test("Orbit resets its sortable grid when a drag is rejected while busy", async () => {
  const habits = [savedHabit, secondHabit];
  const onRemove = jest.fn();
  const onReorder = jest.fn();
  const view = await render(
    <OrbitContent
      habits={habits}
      busy={false}
      error={null}
      gridResetKey={0}
      onRemove={onRemove}
      onReorder={onReorder}
    />,
  );

  await fireEvent(screen.getByTestId("sortable-grid"), "dragEnd", {
    data: [secondHabit, savedHabit],
    fromIndex: 0,
    toIndex: 1,
  });

  expect(
    screen
      .getAllByRole("button", { name: /^Edit / })
      .map((button) => button.props.accessibilityLabel),
  ).toEqual([`Edit ${secondHabit.name}`, `Edit ${savedHabit.name}`]);

  await view.rerender(
    <OrbitContent
      habits={habits}
      busy
      error="Another update is in progress. Try reordering again."
      gridResetKey={1}
      onRemove={onRemove}
      onReorder={onReorder}
    />,
  );

  expect(
    screen.getByText("Another update is in progress. Try reordering again."),
  ).toBeOnTheScreen();
  expect(
    screen
      .getAllByRole("button", { name: /^Edit / })
      .map((button) => button.props.accessibilityLabel),
  ).toEqual([`Edit ${savedHabit.name}`, `Edit ${secondHabit.name}`]);
  expect(onReorder).toHaveBeenCalledWith([secondHabit.id, savedHabit.id]);
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
    <OrbitContent
      habits={[]}
      busy
      error={null}
      gridResetKey={0}
      onRemove={jest.fn()}
      onReorder={jest.fn()}
    />,
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
