import { expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import SettingsTimezoneSection from "../src/settings/timezone/settings-timezone-section";

test("device timezone restores an edited draft even when already saved", async () => {
  const save = jest.fn(async () => true);
  await render(
    <SettingsTimezoneSection
      timezone="Europe/London"
      deviceTimezone="Europe/London"
      busy={false}
      onSave={save}
    />,
  );
  await fireEvent.press(
    screen.getByRole("button", { name: /Change timezone/ }),
  );
  expect(
    screen.getByRole("button", { name: "Use device timezone" }),
  ).toBeDisabled();
  await fireEvent.changeText(
    screen.getByLabelText("Timezone name"),
    "Asia/Tokyo",
  );
  expect(
    screen.getByRole("button", { name: "Use device timezone" }),
  ).toBeEnabled();
  await fireEvent.press(
    screen.getByRole("button", { name: "Use device timezone" }),
  );
  expect(save).toHaveBeenCalledWith("Europe/London");
  await fireEvent.press(
    screen.getByRole("button", { name: /Change timezone/ }),
  );
  expect(screen.getByLabelText("Timezone name")).toHaveDisplayValue(
    "Europe/London",
  );
});
