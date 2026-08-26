import { api } from "@orbii/backend";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import SetupWizardScreen from "../setup/setup-wizard-screen";
import BootSpinner from "./boot-spinner";

export default function SetupGate() {
  const router = useRouter();
  const habits = useQuery(api.habits.list, {});

  if (habits === undefined) {
    return <BootSpinner />;
  }

  return (
    <SetupWizardScreen
      onComplete={() => {
        router.replace("/(tabs)/today");
      }}
    />
  );
}
