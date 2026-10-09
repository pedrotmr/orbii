import { api } from "@orbii/backend";
import { useMutation, useQuery } from "convex/react";
import { randomUUID } from "expo-crypto";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import BootSpinner from "../../components/boot-spinner";
import ScreenScaffold from "../../components/layout/screen-scaffold";
import InlineError from "../../components/states/inline-error";
import HabitCreateScreen from "./habit-create-screen";

export default function HabitCreateRouteContent() {
  const { habitKey: routeHabitKey } = useLocalSearchParams<{
    habitKey?: string | string[];
  }>();
  const isEditing = routeHabitKey !== undefined;
  const habitKey =
    typeof routeHabitKey === "string" ? routeHabitKey : undefined;
  const habits = useQuery(api.habits.list, {});
  const addHabit = useMutation(api.habits.add);
  const updateHabit = useMutation(api.habits.update);
  const [newHabitKey] = useState(() => `custom-${randomUUID()}`);
  const initialHabit = habitKey
    ? habits?.find((habit) => habit.id === habitKey)
    : undefined;

  if (isEditing && habits === undefined) {
    return <BootSpinner />;
  }

  if (isEditing && !initialHabit) {
    return (
      <ScreenScaffold>
        <InlineError message="We couldn’t find that habit in your Orbit." />
      </ScreenScaffold>
    );
  }

  return (
    <HabitCreateScreen
      key={initialHabit?.id ?? "new"}
      initialHabit={initialHabit}
      onSave={(input) =>
        initialHabit
          ? updateHabit({ habitKey: initialHabit.id, ...input })
          : addHabit({ habitKey: newHabitKey, ...input })
      }
    />
  );
}
