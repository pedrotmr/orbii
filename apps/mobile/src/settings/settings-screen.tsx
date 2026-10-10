import { useAuth } from "@clerk/expo";
import { api } from "@orbii/backend";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useState } from "react";
import type { DailyReminderKind } from "../reminders/daily-reminder-schedule";
import BootSpinner from "../components/boot-spinner";
import ScreenScaffold from "../components/layout/screen-scaffold";
import InlineError from "../components/states/inline-error";
import { deviceTimezone } from "../local-date";
import { useDailyReminders } from "../reminders/daily-reminders-provider";
import SettingsContent from "./body/settings-content";

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const router = useRouter();
  const user = useQuery(api.users.get, {});
  const setCapacity = useMutation(api.users.setCapacity);
  const setRewardsVisible = useMutation(api.users.setRewardsVisible);
  const setTimezone = useMutation(api.users.setTimezone);
  const reminders = useDailyReminders();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deviceTz = deviceTimezone();

  const run = async (fn: () => Promise<unknown>) => {
    if (busy) {
      return false;
    }

    try {
      setBusy(true);
      setError(null);
      await fn();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (user === undefined) {
    return <BootSpinner label="Loading settings" />;
  }

  if (user === null) {
    return (
      <ScreenScaffold tabbed>
        <InlineError message="We couldn’t load your preferences. Please reopen the app." />
      </ScreenScaffold>
    );
  }

  const handleCapacity = (capacity: number) => {
    if (capacity === user.capacity) {
      return;
    }

    void run(async () => {
      await setCapacity({ capacity });
    });
  };

  const handleRewardsVisible = (visible: boolean) => {
    if (visible === user?.rewardsVisible) {
      return;
    }

    void run(async () => {
      await setRewardsVisible({ visible });
    });
  };

  const handleTimezone = async (timezone: string) => {
    return await run(async () => {
      await setTimezone({ timezone });
    });
  };

  const handleSignOut = () => {
    void run(async () => {
      await signOut();
    });
  };

  const handleReminder = (kind: DailyReminderKind, enabled: boolean) => {
    void reminders.setReminderEnabled(kind, enabled);
  };

  const handleOpenReminderSettings = () => {
    void run(async () => {
      try {
        await reminders.openSystemSettings();
      } catch {
        throw new Error("We couldn’t open system Settings. Try again.");
      }
    });
  };

  return (
    <SettingsContent
      capacity={user.capacity}
      rewardsVisible={user.rewardsVisible}
      timezone={user.timezone}
      deviceTimezone={deviceTz}
      busy={busy}
      error={error}
      reminderPreferences={reminders.preferences}
      remindersLoading={reminders.isLoading}
      remindersSaving={reminders.isSaving}
      reminderPermissionMessage={reminders.permissionMessage}
      onCapacity={handleCapacity}
      onPointHistory={() => router.push("/points-history")}
      onRewardsVisible={handleRewardsVisible}
      onTimezone={handleTimezone}
      onReminder={handleReminder}
      onOpenReminderSettings={handleOpenReminderSettings}
      onSignOut={handleSignOut}
    />
  );
}
