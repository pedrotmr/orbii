import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Redirect } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import BootSpinner from "../src/components/boot-spinner";
import EnsureUserGate from "../src/components/ensure-user-gate";
import HabitCreateRouteContent from "../src/habits/create/habit-create-route-content";

export default function HabitCreateRoute() {
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
          <HabitCreateRouteContent />
        </EnsureUserGate>
      </Authenticated>
    </SafeAreaProvider>
  );
}
