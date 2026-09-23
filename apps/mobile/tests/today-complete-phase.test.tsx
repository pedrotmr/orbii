import { expect, test } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import TodayCompletePhase from "../src/today/complete/today-complete-phase";

const habit = { id: "habit-1", name: "Read", glyph: "symbol:book" };

test("empty completed state keeps celebration and stats without an invented ring or habits card", async () => {
  await render(
    <TodayCompletePhase streak={3} daysCompleted={7} committedHabits={[]} />,
  );

  expect(screen.getByText("Today’s Orbit\ncomplete.")).toBeOnTheScreen();
  expect(screen.getByText("3")).toBeOnTheScreen();
  expect(screen.getByText("7")).toBeOnTheScreen();
  expect(screen.queryByLabelText("0 of 0 daily habits complete")).toBeNull();
  expect(screen.queryByText("Read")).toBeNull();
});

test("nonempty completed state keeps the ring and completed habits", async () => {
  await render(
    <TodayCompletePhase
      streak={3}
      daysCompleted={7}
      committedHabits={[habit]}
    />,
  );

  expect(
    screen.getByLabelText("1 of 1 daily habits complete"),
  ).toBeOnTheScreen();
  expect(screen.getByText("Read")).toBeOnTheScreen();
});
