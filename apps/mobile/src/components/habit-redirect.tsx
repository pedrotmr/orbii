import { api } from "@orbii/backend";
import { useQuery } from "convex/react";
import { Redirect } from "expo-router";
import BootSpinner from "./boot-spinner";

export default function HabitRedirect() {
  const habits = useQuery(api.habits.list, {});

  if (habits === undefined) {
    return <BootSpinner />;
  }

  if (habits.length === 0) {
    return <Redirect href="/setup" />;
  }

  return <Redirect href="/(tabs)/today" />;
}
