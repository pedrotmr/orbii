import { useAuth } from "@clerk/expo";
import { api } from "@orbii/backend";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import BootSpinner from "../components/boot-spinner";
import ScreenScaffold from "../components/layout/screen-scaffold";
import InlineError from "../components/states/inline-error";
import { deviceTimezone } from "../local-date";
import SettingsContent from "./body/settings-content";

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const user = useQuery(api.users.get, {});
  const setCapacity = useMutation(api.users.setCapacity);
  const setTimezone = useMutation(api.users.setTimezone);
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

  return (
    <SettingsContent
      capacity={user.capacity}
      timezone={user.timezone}
      deviceTimezone={deviceTz}
      busy={busy}
      error={error}
      onCapacity={handleCapacity}
      onTimezone={handleTimezone}
      onSignOut={handleSignOut}
    />
  );
}
