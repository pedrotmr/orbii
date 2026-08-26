import { useAuth } from "@clerk/expo";
import { api } from "@orbii/backend";
import { colors, fontSize, space } from "@orbii/tokens";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import GhostButton from "./components/ghost-button";
import PrimaryButton from "./components/primary-button";
import { deviceTimezone } from "./local-date";
import RitualScreen from "./ritual/ritual-screen";
import SetupWizardScreen from "./setup/setup-wizard-screen";

export default function AuthenticatedApp() {
  const { signOut } = useAuth();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bootAttempt, setBootAttempt] = useState(0);
  const [inSetup, setInSetup] = useState(false);

  const ensureUser = useMutation(api.users.ensure);

  useEffect(() => {
    void (async () => {
      try {
        setError(null);
        await ensureUser({ timezone: deviceTimezone() });
        setReady(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to connect");
      }
    })();
  }, [ensureUser, bootAttempt]);

  const habits = useQuery(api.habits.list, ready ? {} : "skip");

  useEffect(() => {
    if (habits !== undefined && habits.length === 0) {
      setInSetup(true);
    }
  }, [habits]);

  if (!ready || habits === undefined) {
    return (
      <View style={styles.boot}>
        {error ? (
          <>
            <Text style={styles.error}>{error}</Text>
            <PrimaryButton
              label="Try again"
              onPress={() => setBootAttempt((n) => n + 1)}
            />
            <GhostButton label="Sign out" onPress={() => void signOut()} />
          </>
        ) : (
          <ActivityIndicator color={colors.primary} />
        )}
      </View>
    );
  }

  if (inSetup || habits.length === 0) {
    return (
      <SetupWizardScreen
        onComplete={() => {
          setInSetup(false);
        }}
      />
    );
  }

  return <RitualScreen />;
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    gap: space[3],
    padding: space[6],
  },
  error: {
    color: colors.primaryDeep,
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
