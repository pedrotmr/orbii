import { api } from "@orbii/backend";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useMutation,
} from "convex/react";
import { randomUUID } from "expo-crypto";
import { Redirect } from "expo-router";
import { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import BootSpinner from "../src/components/boot-spinner";
import EnsureUserGate from "../src/components/ensure-user-gate";
import HabitCreateScreen from "../src/habits/create/habit-create-screen";

export default function HabitCreateRoute() {
  const addHabit = useMutation(api.habits.add);
  const [habitKey] = useState(() => `custom-${randomUUID()}`);
  return (
    <SafeAreaProvider>
      <AuthLoading>
        <BootSpinner />
      </AuthLoading>
      <Unauthenticated>
        <Redirect href="/welcome" />
      </Unauthenticated>
      <Authenticated>
        <EnsureUserGate>
          <HabitCreateScreen
            onSave={(input) => addHabit({ habitKey, ...input })}
          />
        </EnsureUserGate>
      </Authenticated>
    </SafeAreaProvider>
  );
}
