import { useRouter } from "expo-router";
import SetupWizardScreen from "../setup/setup-wizard-screen";

export default function SetupWizardHost() {
  const router = useRouter();

  return (
    <SetupWizardScreen
      onComplete={() => {
        router.replace("/(tabs)/today");
      }}
    />
  );
}
