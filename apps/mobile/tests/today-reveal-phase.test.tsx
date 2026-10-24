import { expect, jest, test } from "@jest/globals";
import {
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react-native";
import TodayRevealPhase from "../src/today/reveal/today-reveal-phase";

const offeredHabits = [
  { id: "habit-1", name: "Walk", glyph: "↗", pointValue: 10 },
  { id: "habit-2", name: "Read", glyph: "▭", pointValue: 20 },
  { id: "habit-3", name: "Journal", glyph: "✎", pointValue: 20 },
  { id: "habit-4", name: "Stretch", glyph: "∿", pointValue: 10 },
  { id: "habit-5", name: "Meditate", glyph: "○", pointValue: 10 },
];

test("usual count is guidance and every offered habit stays selectable", async () => {
  const onToggle = jest.fn();
  const onCommit = jest.fn();
  const { rerender } = await render(
    <TodayRevealPhase
      usualCount={2}
      selectedIds={[]}
      offeredHabits={offeredHabits}
      busy={false}
      onToggle={onToggle}
      onCommit={onCommit}
      onShuffle={jest.fn()}
    />,
  );

  expect(
    screen.getByText("Pick 1–5; your usual 2 is just a guide."),
  ).toBeOnTheScreen();
  const walkHabit = screen.getByRole("checkbox", {
    name: "Walk, 10 points",
    checked: false,
  });
  expect(walkHabit).toBeOnTheScreen();
  expect(within(walkHabit).getByText("Walk")).toBeOnTheScreen();
  expect(within(walkHabit).getByText("10 points")).toBeOnTheScreen();
  expect(screen.getAllByText("10 points")).toHaveLength(3);
  expect(
    screen.getByRole("button", { name: "Commit today’s Orbit" }),
  ).toBeDisabled();

  await rerender(
    <TodayRevealPhase
      usualCount={2}
      selectedIds={["habit-1", "habit-2"]}
      offeredHabits={offeredHabits}
      busy={false}
      onToggle={onToggle}
      onCommit={onCommit}
      onShuffle={jest.fn()}
    />,
  );

  expect(
    screen.getByRole("checkbox", {
      name: "Walk, 10 points",
      checked: true,
    }),
  ).toBeOnTheScreen();

  const thirdHabit = screen.getByRole("checkbox", {
    name: "Journal, 20 points",
  });
  expect(thirdHabit).toBeEnabled();
  await fireEvent.press(thirdHabit);
  expect(onToggle).toHaveBeenCalledWith("habit-3");
  expect(
    screen.getByRole("button", { name: "Commit today’s Orbit" }),
  ).toBeEnabled();
});

test("single-habit offer keeps the pick guidance accurate", async () => {
  await render(
    <TodayRevealPhase
      usualCount={2}
      selectedIds={[]}
      offeredHabits={[offeredHabits[0]]}
      busy={false}
      onToggle={jest.fn()}
      onCommit={jest.fn()}
      onShuffle={jest.fn()}
    />,
  );

  expect(
    screen.getByText("Pick the habit; your usual 2 is just a guide."),
  ).toBeOnTheScreen();
});

test("empty offer does not show an invalid pick range", async () => {
  await render(
    <TodayRevealPhase
      usualCount={2}
      selectedIds={[]}
      offeredHabits={[]}
      busy={false}
      onToggle={jest.fn()}
      onCommit={jest.fn()}
      onShuffle={jest.fn()}
    />,
  );

  expect(
    screen.getByText("No habits offered; your usual 2 is just a guide."),
  ).toBeOnTheScreen();
  expect(screen.queryByText("Pick 1–0")).not.toBeOnTheScreen();
});
