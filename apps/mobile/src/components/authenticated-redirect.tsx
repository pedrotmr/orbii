import { useAuth } from "@clerk/expo";
import { api } from "@orbii/backend";
import { colors, fontSize, space } from "@orbii/tokens";
import { useMutation, useQuery } from "convex/react";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { deviceTimezone } from "../local-date";
import BootSpinner from "./boot-spinner";
import GhostButton from "./ghost-button";
import PrimaryButton from "./primary-button";

export default function AuthenticatedRedirect() {
  const { signOut } = useAuth();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bootAttempt, setBootAttempt] = useState(0);
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

  const handleSignOut = async () => {
    try {
      setError(null);
      await signOut();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign out failed");
    }
  };

  if (!ready || habits === undefined) {
    if (error) {
      return (
        <View style={styles.boot}>
          <Text style={styles.error}>{error}</Text>
          <PrimaryButton
            label="Try again"
            onPress={() => setBootAttempt((n) => n + 1)}
          />
          <GhostButton label="Sign out" onPress={() => void handleSignOut()} />
        </View>
      );
    }

    return <BootSpinner />;
  }

  if (habits.length === 0) {
    return <Redirect href="/setup" />;
  }

  return <Redirect href="/(tabs)/today" />;
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
