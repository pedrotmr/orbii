import { useEffect, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

export const deviceTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

export const todayLocalInTimezone = (timeZone: string) => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
};

export const todayLocal = () => todayLocalInTimezone(deviceTimezone());

const msUntilNextLocalMidnight = (timeZone: string) => {
  const now = Date.now();
  const today = todayLocalInTimezone(timeZone);
  const nextMinute = now - (now % 60_000) + 60_000;

  for (let minute = 0; minute < 60 * 26; minute += 1) {
    const candidate = nextMinute + minute * 60_000;
    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(candidate));

    if (date !== today) {
      return candidate - now;
    }
  }

  return 60_000;
};

/** Calendar date that advances on foreground resume and at timezone midnight. */
export const useTodayLocal = (timeZone?: string | null) => {
  const tz =
    timeZone && timeZone.trim().length > 0 ? timeZone.trim() : deviceTimezone();
  const [localDate, setLocalDate] = useState(() => todayLocalInTimezone(tz));

  useEffect(() => {
    const sync = () => {
      const next = todayLocalInTimezone(tz);
      setLocalDate((prev) => (prev === next ? prev : next));
    };

    sync();

    const onAppState = (state: AppStateStatus) => {
      if (state === "active") {
        sync();
      }
    };

    const sub = AppState.addEventListener("change", onAppState);

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const scheduleMidnight = () => {
      timeoutId = setTimeout(() => {
        sync();
        scheduleMidnight();
      }, msUntilNextLocalMidnight(tz));
    };

    scheduleMidnight();

    return () => {
      sub.remove();

      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
  }, [tz]);

  return localDate;
};
