import { api } from "@orbii/backend";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Alert } from "react-native";
import BootSpinner from "../components/boot-spinner";
import ScreenScaffold from "../components/layout/screen-scaffold";
import InlineError from "../components/states/inline-error";
import { useTodayLocal } from "../local-date";
import OrbitContent from "./body/orbit-content";

export default function OrbitScreen() {
  const user = useQuery(api.users.get, {});
  const localDate = useTodayLocal(user?.timezone);
  const habits = useQuery(api.habits.list, {});
  const removeHabit = useMutation(api.habits.remove);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  if (habits === undefined || user === undefined) {
    return <BootSpinner />;
  }

  if (user === null) {
    return (
      <ScreenScaffold tabbed>
        <InlineError message="We couldn’t load your Orbit. Please try opening the app again." />
      </ScreenScaffold>
    );
  }

  const handleRemove = (habitKey: string) => {
    Alert.alert(
      "Remove habit",
      "This habit will leave your Orbit and today’s focus.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            void run(async () => {
              await removeHabit({ habitKey, localDate });
            });
          },
        },
      ],
    );
  };

  return (
    <OrbitContent
      habits={habits}
      busy={busy}
      error={error}
      onRemove={handleRemove}
    />
  );
}
