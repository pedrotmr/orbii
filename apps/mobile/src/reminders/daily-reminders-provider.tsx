import { useAuth } from "@clerk/expo";
import { api } from "@orbii/backend";
import { useQuery } from "convex/react";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, Linking } from "react-native";
import type {
  DailyReminderKind,
  DailyReminderPreferences,
} from "./daily-reminder-schedule";
import {
  deviceTimezone,
  todayLocalInTimezone,
  useTodayLocal,
} from "../local-date";
import {
  cancelDailyReminderQueue,
  emptyDailyReminderPreferences,
  hasDailyReminderPermission,
  isOrbiiReminderResponse,
  loadDailyReminderPreferences,
  requestDailyReminderPermission,
  saveDailyReminderPreferences,
  syncDailyReminderQueue,
} from "./daily-reminders";

interface DailyRemindersContextValue {
  preferences: DailyReminderPreferences;
  isLoading: boolean;
  isSaving: boolean;
  permissionMessage: string | null;
  setReminderEnabled: (
    kind: DailyReminderKind,
    enabled: boolean,
  ) => Promise<boolean>;
  openSystemSettings: () => Promise<void>;
}

interface DailyRemindersProviderProps {
  children: ReactNode;
}

const DailyRemindersContext = createContext<DailyRemindersContextValue | null>(
  null,
);

const hasEnabledReminder = (preferences: DailyReminderPreferences) => {
  return preferences.morning || preferences.evening;
};

export function DailyRemindersProvider({
  children,
}: DailyRemindersProviderProps) {
  const { userId } = useAuth();
  const router = useRouter();
  const user = useQuery(api.users.get, {});
  const localDate = useTodayLocal(user?.timezone);
  const timezone = user?.timezone?.trim() || deviceTimezone();
  const isLocalDateReady =
    user !== undefined &&
    user !== null &&
    localDate === todayLocalInTimezone(timezone);
  const day = useQuery(api.day.get, isLocalDateReady ? { localDate } : "skip");
  const phase = day?.session.phase;
  const [preferences, setPreferences] = useState(emptyDailyReminderPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState<string | null>(
    null,
  );
  const [appOpenRevision, setAppOpenRevision] = useState(0);
  const saveLock = useRef(false);
  const scheduledOperation = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    return () => {
      scheduledOperation.current = scheduledOperation.current
        .catch(() => undefined)
        .then(() => cancelDailyReminderQueue())
        .catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);

    if (!userId) {
      setPreferences(emptyDailyReminderPreferences);
      setIsLoading(false);
      return () => {
        isCurrent = false;
      };
    }

    void loadDailyReminderPreferences(userId)
      .then((nextPreferences) => {
        if (isCurrent) {
          setPreferences(nextPreferences);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setPermissionMessage("We couldn’t load your reminder preferences.");
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [userId]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        setAppOpenRevision((revision) => revision + 1);
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    let isCurrent = true;

    if (!isLoading && hasEnabledReminder(preferences)) {
      void hasDailyReminderPermission()
        .then((hasPermission) => {
          if (!isCurrent) {
            return;
          }

          if (hasPermission) {
            setPermissionMessage(null);
          } else {
            setPermissionMessage(
              "Allow notifications for Orbii in system Settings to receive reminders.",
            );
          }
        })
        .catch(() => {
          if (isCurrent) {
            setPermissionMessage(
              "We couldn’t check notification access. Review Orbii in system Settings.",
            );
          }
        });
    }

    return () => {
      isCurrent = false;
    };
  }, [appOpenRevision, isLoading, preferences]);

  useEffect(() => {
    if (!userId || user === null) {
      scheduledOperation.current = scheduledOperation.current
        .catch(() => undefined)
        .then(() => cancelDailyReminderQueue())
        .catch(() => undefined);
      return;
    }

    if (
      isLoading ||
      user === undefined ||
      !isLocalDateReady ||
      phase === undefined
    ) {
      return;
    }

    let isCurrent = true;
    scheduledOperation.current = scheduledOperation.current
      .catch(() => undefined)
      .then(async () => {
        if (!isCurrent) {
          return;
        }

        try {
          await syncDailyReminderQueue({
            timeZone: timezone,
            preferences,
            phase,
          });
        } catch {
          if (isCurrent) {
            setPermissionMessage(
              "We couldn’t refresh reminders. Check notification access in system Settings.",
            );
          }
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [
    appOpenRevision,
    isLoading,
    isLocalDateReady,
    phase,
    preferences,
    timezone,
    user === undefined,
    user === null,
    userId,
  ]);

  useEffect(() => {
    const handleResponse = (response: Notifications.NotificationResponse) => {
      if (!isOrbiiReminderResponse(response)) {
        return;
      }

      router.navigate("/(tabs)/today");
    };
    const subscription =
      Notifications.addNotificationResponseReceivedListener(handleResponse);
    let isCurrent = true;

    void Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (isCurrent && response) {
          handleResponse(response);
          return Notifications.clearLastNotificationResponseAsync();
        }
      })
      .catch(() => undefined);

    return () => {
      isCurrent = false;
      subscription.remove();
    };
  }, [router]);

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    return () => Notifications.setNotificationHandler(null);
  }, []);

  const setReminderEnabled = useCallback(
    async (kind: DailyReminderKind, enabled: boolean) => {
      if (saveLock.current || !userId) {
        return false;
      }

      saveLock.current = true;
      setIsSaving(true);

      try {
        setPermissionMessage(null);

        if (enabled && !(await requestDailyReminderPermission())) {
          setPermissionMessage(
            "Allow notifications for Orbii in system Settings to turn on reminders.",
          );
          return false;
        }

        const nextPreferences = { ...preferences, [kind]: enabled };
        await saveDailyReminderPreferences(userId, nextPreferences);
        setPreferences(nextPreferences);
        return true;
      } catch {
        setPermissionMessage("We couldn’t save your reminder preferences.");
        return false;
      } finally {
        saveLock.current = false;
        setIsSaving(false);
      }
    },
    [preferences, userId],
  );

  const openSystemSettings = useCallback(async () => {
    await Linking.openSettings();
  }, []);

  const value = useMemo(
    () => ({
      preferences,
      isLoading,
      isSaving,
      permissionMessage,
      setReminderEnabled,
      openSystemSettings,
    }),
    [
      isLoading,
      isSaving,
      openSystemSettings,
      permissionMessage,
      preferences,
      setReminderEnabled,
    ],
  );

  return (
    <DailyRemindersContext.Provider value={value}>
      {children}
    </DailyRemindersContext.Provider>
  );
}

export const useDailyReminders = () => {
  const context = useContext(DailyRemindersContext);

  if (!context) {
    throw new Error(
      "useDailyReminders must be used within DailyRemindersProvider",
    );
  }

  return context;
};
