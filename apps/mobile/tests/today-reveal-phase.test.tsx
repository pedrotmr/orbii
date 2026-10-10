import { expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
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

  expect(screen.getByText("Your usual")).toBeOnTheScreen();
  expect(screen.getByText("2")).toBeOnTheScreen();
  expect(
    screen.getByRole("checkbox", {
      name: "Walk, 10 points",
      checked: false,
    }),
  ).toBeOnTheScreen();
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
