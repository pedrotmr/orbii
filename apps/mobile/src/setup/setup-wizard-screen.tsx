import { useAuth } from "@clerk/expo";
import { api } from "@orbii/backend";
import { colors, fontSize, space } from "@orbii/tokens";
import { useMutation, useQuery } from "convex/react";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GhostButton from "../components/ghost-button";
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
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
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
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.brand}>Orbii</Text>
        <Text style={styles.progress}>{stepNumber} of 3</Text>

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

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <GhostButton
          label="Sign out"
          disabled={busy}
          onPress={() =>
            void run(async () => {
              await signOut();
            })
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    padding: space[6],
    paddingBottom: space[12],
    gap: space[4],
    flexGrow: 1,
  },
  brand: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  progress: {
    fontSize: fontSize.sm,
    color: colors.muted,
    fontWeight: "600",
  },
  error: {
    color: colors.primaryDeep,
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
