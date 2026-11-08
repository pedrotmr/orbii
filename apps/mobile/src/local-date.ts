import { localDateInTimezone } from "@orbii/backend";
import { useEffect, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

export const deviceTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

const msUntilNextLocalMidnight = (timeZone: string) => {
  const now = Date.now();
  const today = localDateInTimezone(timeZone, now);
  const nextMinute = now - (now % 60_000) + 60_000;

  for (let minute = 0; minute < 60 * 26; minute += 1) {
    const candidate = nextMinute + minute * 60_000;
    const date = localDateInTimezone(timeZone, candidate);

    if (date !== today) {
      return candidate - now;
    }
  }

  return 60_000;
};

export const isLocalDateReady = (
  localDate: string,
  timeZone?: string | null,
) => {
  const currentTimezone = timeZone?.trim() || deviceTimezone();
  return localDate === localDateInTimezone(currentTimezone);
};

/** Calendar date that advances on foreground resume and at timezone midnight. */
export const useTodayLocal = (timeZone?: string | null) => {
  const tz =
    timeZone && timeZone.trim().length > 0 ? timeZone.trim() : deviceTimezone();
  const [localDate, setLocalDate] = useState(() => localDateInTimezone(tz));

  useEffect(() => {
    const sync = () => {
      const next = localDateInTimezone(tz);
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
