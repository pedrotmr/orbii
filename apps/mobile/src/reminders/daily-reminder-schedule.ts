export type DailyReminderKind = "morning" | "evening";
export type DailyReminderPhase = "idle" | "reveal" | "active" | "complete";

export interface DailyReminderPreferences {
  morning: boolean;
  evening: boolean;
}

export interface ScheduledDailyReminder {
  kind: DailyReminderKind;
  localDate: string;
  date: Date;
  body: string;
}

interface BuildDailyReminderScheduleArgs {
  now: Date;
  timeZone: string;
  preferences: DailyReminderPreferences;
  phase: DailyReminderPhase;
  days?: number;
}

const REMINDER_HOURS: Record<DailyReminderKind, number> = {
  morning: 8,
  evening: 20,
};

const REMINDER_COPY: Record<DailyReminderKind, string> = {
  morning: "Ready to choose today's Orbit?",
  evening: "Want to finish today's Orbit?",
};

const getLocalDate = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );

  return values.year + "-" + values.month + "-" + values.day;
};

const getLocalDateTimeParts = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
};

const addCalendarDays = (localDate: string, days: number) => {
  const [year, month, day] = localDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
};

const localDateTimeToInstant = (
  localDate: string,
  hour: number,
  timeZone: string,
) => {
  const [year, month, day] = localDate.split("-").map(Number);
  const targetAsUtc = Date.UTC(year, month - 1, day, hour);
  let candidate = targetAsUtc;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const actual = getLocalDateTimeParts(new Date(candidate), timeZone);
    const actualAsUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second,
    );
    const adjustment = targetAsUtc - actualAsUtc;

    if (adjustment === 0) {
      break;
    }

    candidate += adjustment;
  }

  return new Date(candidate);
};

export const buildDailyReminderSchedule = ({
  now,
  timeZone,
  preferences,
  phase,
  days = 30,
}: BuildDailyReminderScheduleArgs) => {
  const firstLocalDate = getLocalDate(now, timeZone);
  const reminders: ScheduledDailyReminder[] = [];

  for (let dayOffset = 0; dayOffset < days; dayOffset += 1) {
    const localDate = addCalendarDays(firstLocalDate, dayOffset);

    for (const kind of ["morning", "evening"] as const) {
      if (!preferences[kind]) {
        continue;
      }

      if (
        dayOffset === 0 &&
        ((kind === "morning" && (phase === "active" || phase === "complete")) ||
          (kind === "evening" && phase === "complete"))
      ) {
        continue;
      }

      const date = localDateTimeToInstant(
        localDate,
        REMINDER_HOURS[kind],
        timeZone,
      );

      if (date.getTime() <= now.getTime()) {
        continue;
      }

      reminders.push({
        kind,
        localDate,
        date,
        body: REMINDER_COPY[kind],
      });
    }
  }

  return reminders;
};
