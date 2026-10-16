import { expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import TodayActivePhase from "../src/today/active/today-active-phase";

test("active rows show the point value saved when the commitment was made", async () => {
  const onToggle = jest.fn();
  await render(
    <TodayActivePhase
      committedHabits={[
        {
          id: "walk",
          name: "Walk",
          glyph: "symbol:walk",
          pointValue: 10,
        },
      ]}
      completedIds={[]}
      busy={false}
      canReshuffle
      onToggle={onToggle}
      onReshuffle={jest.fn()}
    />,
  );

  const habit = screen.getByRole("checkbox", { name: "Walk, 10 points" });
  expect(habit).toBeOnTheScreen();
  expect(screen.getByText("10 points")).toBeOnTheScreen();
  await fireEvent.press(habit);
  expect(onToggle).toHaveBeenCalledWith("walk");
});

test("hides reshuffle when the Orbit has no live habits", async () => {
  await render(
    <TodayActivePhase
      committedHabits={[
        {
          id: "deleted-walk",
          name: "Walk before removal",
          glyph: "symbol:walk",
          pointValue: 10,
        },
      ]}
      completedIds={[]}
      busy={false}
      canReshuffle={false}
      onToggle={jest.fn()}
      onReshuffle={jest.fn()}
    />,
  );

  expect(
    screen.queryByRole("button", { name: "Choose a different focus" }),
  ).toBeNull();
  expect(
    screen.getByRole("checkbox", { name: "Walk before removal, 10 points" }),
  ).toBeOnTheScreen();
});
