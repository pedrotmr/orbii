import { api } from "@orbii/backend";
import { colors } from "@orbii/tokens";
import { useQuery } from "convex/react";
import { Redirect, Tabs } from "expo-router";
import BootSpinner from "./boot-spinner";

export default function TabsWithOrbitGate() {
  const habits = useQuery(api.habits.list, {});

  if (habits === undefined) {
    return <BootSpinner />;
  }

  if (habits.length === 0) {
    return <Redirect href="/setup" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
        },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: "Today",
        }}
      />
      <Tabs.Screen
        name="orbit"
        options={{
          title: "Orbit",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
        }}
      />
    </Tabs>
  );
}
