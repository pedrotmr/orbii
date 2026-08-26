import { useEffect, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

export const todayLocal = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const deviceTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

const msUntilNextLocalMidnight = () => {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
};

/** Calendar date that advances on foreground resume and at local midnight. */
export const useTodayLocal = () => {
  const [localDate, setLocalDate] = useState(todayLocal);

  useEffect(() => {
    const sync = () => {
      const next = todayLocal();
      setLocalDate((prev) => (prev === next ? prev : next));
    };

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
      }, msUntilNextLocalMidnight());
    };

    scheduleMidnight();

    return () => {
      sub.remove();

      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return localDate;
};
