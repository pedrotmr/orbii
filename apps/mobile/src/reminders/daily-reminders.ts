import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import {
  buildDailyReminderSchedule,
  type DailyReminderKind,
  type DailyReminderPhase,
  type DailyReminderPreferences,
} from "./daily-reminder-schedule";

const STORAGE_PREFIX = "@orbii/daily-reminders/v1/";
const PHASE_STORAGE_PREFIX = "@orbii/daily-reminder-phase/v1/";
const NOTIFICATION_MARKER = "orbiiDailyReminder";
const NOTIFICATION_CHANNEL_ID = "daily-reminders";

export const emptyDailyReminderPreferences: DailyReminderPreferences = {
  morning: false,
  evening: false,
};

export const loadDailyReminderPreferences = async (userId: string) => {
  const serialized = await AsyncStorage.getItem(`${STORAGE_PREFIX}${userId}`);

  if (!serialized) {
    return emptyDailyReminderPreferences;
  }

  try {
    const value: unknown = JSON.parse(serialized);

    if (typeof value !== "object" || value === null) {
      return emptyDailyReminderPreferences;
    }

    const preferences = value as Record<string, unknown>;
    return {
      morning: preferences.morning === true,
      evening: preferences.evening === true,
    } satisfies DailyReminderPreferences;
  } catch {
    return emptyDailyReminderPreferences;
  }
};

export const saveDailyReminderPreferences = async (
  userId: string,
  preferences: DailyReminderPreferences,
) => {
  await AsyncStorage.setItem(
    `${STORAGE_PREFIX}${userId}`,
    JSON.stringify(preferences),
  );
};

export const loadDailyReminderPhase = async (
  userId: string,
  localDate: string,
) => {
  const serialized = await AsyncStorage.getItem(
    `${PHASE_STORAGE_PREFIX}${userId}`,
  );

  if (!serialized) {
    return "idle";
  }

  let value: unknown;

  try {
    value = JSON.parse(serialized);
  } catch {
    return "idle";
  }

  if (typeof value !== "object" || value === null) {
    return "idle";
  }

  const stored = value as Record<string, unknown>;
  const phase = stored.phase;

  if (
    stored.localDate === localDate &&
    (phase === "idle" ||
      phase === "reveal" ||
      phase === "active" ||
      phase === "complete")
  ) {
    return phase;
  }

  return "idle";
};

export const saveDailyReminderPhase = async (
  userId: string,
  localDate: string,
  phase: DailyReminderPhase,
) => {
  await AsyncStorage.setItem(
    `${PHASE_STORAGE_PREFIX}${userId}`,
    JSON.stringify({ localDate, phase }),
  );
};

const ensureNotificationChannel = async () => {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
    name: "Daily reminders",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
};

export const hasDailyReminderPermission = async () => {
  const permissions = await Notifications.getPermissionsAsync();
  return (
    permissions.granted ||
    permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
};

export const requestDailyReminderPermission = async () => {
  await ensureNotificationChannel();
  const current = await Notifications.getPermissionsAsync();

  if (
    current.granted ||
    current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return (
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
};

const isOrbiiReminder = (request: Notifications.NotificationRequest) => {
  return request.content.data?.[NOTIFICATION_MARKER] === true;
};

export const cancelDailyReminderQueue = async () => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter(isOrbiiReminder)
      .map(({ identifier }) =>
        Notifications.cancelScheduledNotificationAsync(identifier),
      ),
  );
};

interface SyncDailyReminderQueueArgs {
  timeZone: string;
  preferences: DailyReminderPreferences;
  phase: DailyReminderPhase;
  now?: Date;
}

export const syncDailyReminderQueue = async ({
  timeZone,
  preferences,
  phase,
  now = new Date(),
}: SyncDailyReminderQueueArgs) => {
  await ensureNotificationChannel();
  const hasPermission = await hasDailyReminderPermission();

  if ((!preferences.morning && !preferences.evening) || !hasPermission) {
    await cancelDailyReminderQueue();
    return;
  }

  const reminders = buildDailyReminderSchedule({
    now,
    timeZone,
    preferences,
    phase,
  });

  await cancelDailyReminderQueue();

  await Promise.all(
    reminders.map((reminder) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: "Orbii",
          body: reminder.body,
          data: {
            [NOTIFICATION_MARKER]: true,
            kind: reminder.kind satisfies DailyReminderKind,
            localDate: reminder.localDate,
          },
          sound: false,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminder.date,
          ...(Platform.OS === "android"
            ? { channelId: NOTIFICATION_CHANNEL_ID }
            : {}),
        },
      }),
    ),
  );
};

export const isOrbiiReminderResponse = (
  response: Notifications.NotificationResponse,
) => {
  return (
    response.notification.request.content.data?.[NOTIFICATION_MARKER] === true
  );
};
