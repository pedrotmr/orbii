import { expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import SettingsRewardsSection from "../src/settings/rewards/settings-rewards-section";

test("Rewards tab setting reports the next visibility", async () => {
  const onChange = jest.fn();
  await render(
    <SettingsRewardsSection visible busy={false} onChange={onChange} />,
  );

  const toggle = screen.getByRole("switch", { name: "Rewards tab" });
  expect(toggle).toBeOnTheScreen();
  expect(toggle.props.value).toBe(true);

  await fireEvent(toggle, "valueChange", false);
  expect(onChange).toHaveBeenCalledWith(false);
});
