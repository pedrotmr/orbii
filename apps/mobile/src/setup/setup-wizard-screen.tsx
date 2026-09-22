import { useAuth } from "@clerk/expo";
import { api } from "@orbii/backend";
import { type Palette, space } from "@orbii/tokens";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import BootSpinner from "../components/boot-spinner";
import BrandMark from "../components/brand-mark";
import GhostButton from "../components/ghost-button";
import ScreenScaffold from "../components/layout/screen-scaffold";
import InlineError from "../components/states/inline-error";
import { useThemedStyles } from "../theme/use-theme";
import SetupCapacityStep from "./capacity/setup-capacity-step";
import SetupSeedAddStep from "./seed-add/setup-seed-add-step";
import SetupWelcomeStep from "./welcome/setup-welcome-step";

type SetupStep = "welcome" | "seed-add" | "capacity";
interface SetupWizardScreenProps {
  onComplete: () => void;
}

export default function SetupWizardScreen({
  onComplete,
}: SetupWizardScreenProps) {
  const styles = useThemedStyles(createStyles);
  const { signOut } = useAuth();
  const [step, setStep] = useState<SetupStep>("welcome");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const habits = useQuery(api.habits.list, {});
  const setCapacity = useMutation(api.users.setCapacity);

  const run = async (fn: () => Promise<unknown>) => {
    if (busy) {
      return;
    }

    try {
      setBusy(true);
      setError(null);
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  if (habits === undefined) {
    return <BootSpinner />;
  }

  const handleFinish = (capacity: number) => {
    void run(async () => {
      if (habits.length === 0) {
        setStep("seed-add");
        return;
      }

      await setCapacity({ capacity });
      onComplete();
    });
  };

  let stepNumber = 3;

  if (step === "welcome") {
    stepNumber = 1;
  }

  if (step === "seed-add") {
    stepNumber = 2;
  }

  return (
    <ScreenScaffold>
      <View style={styles.header}>
        <BrandMark />
        <Text
          accessibilityLabel={`Setup, step ${stepNumber} of 3`}
          style={styles.progress}
        >
          {stepNumber} of 3
        </Text>
      </View>
      {step === "welcome" ? (
        <SetupWelcomeStep onContinue={() => setStep("seed-add")} />
      ) : null}

      {step === "seed-add" ? (
        <SetupSeedAddStep
          habits={habits}
          busy={busy}
          run={run}
          onContinue={() => setStep("capacity")}
        />
      ) : null}

      {step === "capacity" ? (
        <SetupCapacityStep busy={busy} onFinish={handleFinish} />
      ) : null}

      {error ? <InlineError message={error} /> : null}

      <GhostButton
        label="Sign out"
        disabled={busy}
        onPress={() =>
          void run(async () => {
            await signOut();
          })
        }
      />
    </ScreenScaffold>
  );
}
const createStyles = (colors: Palette) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: space[3],
    },
    progress: { color: colors.muted, fontSize: 13, fontWeight: "500" },
  });
