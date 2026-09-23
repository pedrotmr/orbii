import { expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import {
  defaultHabitSymbol,
  findHabitSymbol,
  habitSymbols,
} from "../src/components/habits/habit-symbol-catalog";
import HabitSymbolPicker from "../src/habits/create/picker/habit-symbol-picker";

test("the initial default symbol remains visible and checked in quick picks", async () => {
  await render(
    <HabitSymbolPicker
      selected={defaultHabitSymbol}
      suggested={undefined}
      onSelect={jest.fn()}
    />,
  );
  expect(
    screen.getByRole("radio", { name: defaultHabitSymbol.label }),
  ).toBeChecked();
  expect(screen.getAllByRole("radio")).toHaveLength(6);
});

test("quick choices include the current and suggested icons without moving after selection", async () => {
  const cold = findHabitSymbol("symbol:cold")!;
  const piano = findHabitSymbol("symbol:piano")!;
  const select = jest.fn();
  const view = await render(
    <HabitSymbolPicker selected={piano} suggested={cold} onSelect={select} />,
  );
  const before = screen
    .getAllByRole("radio")
    .map((item) => item.props.accessibilityLabel);
  expect(before).toHaveLength(6);
  expect(new Set(before).size).toBe(6);
  expect(before).toContain("Cold shower");
  expect(screen.getByRole("radio", { name: "Piano" })).toBeChecked();
  await fireEvent.press(screen.getByRole("radio", { name: "Walk" }));
  expect(select).toHaveBeenCalledWith(findHabitSymbol("symbol:walk"));
  await view.rerender(
    <HabitSymbolPicker
      selected={findHabitSymbol("symbol:walk")!}
      suggested={cold}
      onSelect={select}
    />,
  );
  expect(
    screen.getAllByRole("radio").map((item) => item.props.accessibilityLabel),
  ).toEqual(before);
  expect(screen.getByRole("radio", { name: "Walk" })).toBeChecked();
});

test("browse all reveals the entire collection and category filters narrow it", async () => {
  await render(
    <HabitSymbolPicker
      selected={defaultHabitSymbol}
      suggested={undefined}
      onSelect={jest.fn()}
    />,
  );
  expect(screen.getAllByRole("radio")).toHaveLength(6);
  await fireEvent.press(screen.getByRole("button", { name: /Browse all/ }));
  expect(screen.getAllByRole("radio")).toHaveLength(habitSymbols.length);
  await fireEvent.press(screen.getByRole("button", { name: "Body" }));
  expect(screen.getByRole("button", { name: "Body" })).toBeSelected();
  expect(screen.getByRole("radio", { name: "Cold shower" })).toBeOnTheScreen();
  expect(screen.queryByRole("radio", { name: "Piano" })).toBeNull();
  await fireEvent.press(screen.getByRole("button", { name: "All" }));
  expect(screen.getAllByRole("radio")).toHaveLength(habitSymbols.length);
});

test("search reaches beyond quick choices and empty-result reset clears both filters", async () => {
  const select = jest.fn();
  await render(
    <HabitSymbolPicker
      selected={defaultHabitSymbol}
      suggested={undefined}
      onSelect={select}
    />,
  );
  const search = screen.getByLabelText("Search symbols");
  await fireEvent.changeText(search, "Practice Spanish");
  await fireEvent.press(screen.getByRole("radio", { name: "Language" }));
  expect(select).toHaveBeenCalledWith(findHabitSymbol("symbol:language"));
  await fireEvent.press(screen.getByRole("button", { name: "Body" }));
  expect(screen.getByText("No symbols found")).toBeOnTheScreen();
  await fireEvent.press(
    screen.getByRole("button", { name: "Show all symbols" }),
  );
  expect(screen.getByLabelText("Search symbols")).toHaveDisplayValue("");
  expect(screen.getByRole("button", { name: "All" })).toBeSelected();
  expect(screen.getAllByRole("radio")).toHaveLength(habitSymbols.length);
});
