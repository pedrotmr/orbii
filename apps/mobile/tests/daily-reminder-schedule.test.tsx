import { expect, test } from "@jest/globals";
import {
  buildDailyReminderSchedule,
  formatDailyReminderTime,
} from "../src/reminders/daily-reminder-schedule";

const enabledReminders = { morning: true, evening: true };

test("settings labels follow the scheduled reminder hours", () => {
  expect(formatDailyReminderTime("morning")).toBe("8:00 AM");
  expect(formatDailyReminderTime("evening")).toBe("8:00 PM");
});

test("builds a 30-day queue at the saved timezone's 08:00 and 20:00", () => {
  const reminders = buildDailyReminderSchedule({
    now: new Date("2026-10-10T03:00:00.000Z"),
    timeZone: "America/Sao_Paulo",
    preferences: enabledReminders,
    phase: "idle",
  });

  expect(reminders).toHaveLength(60);
  expect(reminders[0]).toMatchObject({
    kind: "morning",
    localDate: "2026-10-10",
    body: "Ready to choose today's Orbit?",
  });
  expect(reminders[0]?.date.toISOString()).toBe("2026-10-10T11:00:00.000Z");
  expect(reminders[1]?.date.toISOString()).toBe("2026-10-10T23:00:00.000Z");
  expect(reminders[59]?.localDate).toBe("2026-11-08");
});

test("skips only today's morning reminder after today's Orbit is committed", () => {
  const reminders = buildDailyReminderSchedule({
    now: new Date("2026-10-10T03:00:00.000Z"),
    timeZone: "America/Sao_Paulo",
    preferences: enabledReminders,
    phase: "active",
  });

  expect(
    reminders.filter((reminder) => reminder.localDate === "2026-10-10"),
  ).toEqual([
    expect.objectContaining({
      kind: "evening",
      body: "Want to finish today's Orbit?",
      date: new Date("2026-10-10T23:00:00.000Z"),
    }),
  ]);
  expect(
    reminders.some(
      (reminder) =>
        reminder.localDate === "2026-10-11" && reminder.kind === "morning",
    ),
  ).toBe(true);
});

test("skips both of today's reminders after today's Orbit is complete", () => {
  const reminders = buildDailyReminderSchedule({
    now: new Date("2026-10-10T03:00:00.000Z"),
    timeZone: "America/Sao_Paulo",
    preferences: enabledReminders,
    phase: "complete",
  });

  expect(reminders).toHaveLength(58);
  expect(
    reminders.some((reminder) => reminder.localDate === "2026-10-10"),
  ).toBe(false);
});

test("omits reminders whose local time has already passed", () => {
  const reminders = buildDailyReminderSchedule({
    now: new Date("2026-10-10T12:30:00.000Z"),
    timeZone: "America/Sao_Paulo",
    preferences: enabledReminders,
    phase: "idle",
  });

  expect(
    reminders.some(
      (reminder) =>
        reminder.localDate === "2026-10-10" && reminder.kind === "morning",
    ),
  ).toBe(false);
  expect(
    reminders.some(
      (reminder) =>
        reminder.localDate === "2026-10-10" && reminder.kind === "evening",
    ),
  ).toBe(true);
});

test("uses the saved timezone's daylight-saving offset for future instants", () => {
  const reminders = buildDailyReminderSchedule({
    now: new Date("2026-11-01T04:00:00.000Z"),
    timeZone: "America/New_York",
    preferences: { morning: true, evening: false },
    phase: "idle",
    days: 2,
  });

  expect(reminders.map((reminder) => reminder.date.toISOString())).toEqual([
    "2026-11-01T13:00:00.000Z",
    "2026-11-02T13:00:00.000Z",
  ]);
});
