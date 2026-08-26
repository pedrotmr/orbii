import { useAuth } from "@clerk/expo";
import { api } from "@orbii/backend";
import { colors, fontSize, space } from "@orbii/tokens";
import { useMutation, useQuery } from "convex/react";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { deviceTimezone } from "../local-date";
import SettingsSignOutSection from "./account/settings-sign-out-section";
import SettingsCapacitySection from "./capacity/settings-capacity-section";
import SettingsTimezoneSection from "./timezone/settings-timezone-section";

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const user = useQuery(api.users.get, {});
  const setCapacity = useMutation(api.users.setCapacity);
  const setTimezone = useMutation(api.users.setTimezone);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deviceTz = deviceTimezone();

  const run = async (fn: () => Promise<unknown>) => {
    if (busy) {
      return false;
    }

    try {
      setBusy(true);
      setError(null);
      await fn();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (user === undefined) {
    return (
      <SafeAreaView style={styles.boot}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (user === null) {
    return (
      <SafeAreaView style={styles.boot}>
        <Text style={styles.error}>{error ?? "User not ready"}</Text>
      </SafeAreaView>
    );
  }

  const handleCapacity = (capacity: number) => {
    if (capacity === user.capacity) {
      return;
    }

    void run(async () => {
      await setCapacity({ capacity });
    });
  };

  const handleTimezone = async (timezone: string) => {
    return await run(async () => {
      await setTimezone({ timezone });
    });
  };

  const handleSignOut = () => {
    void run(async () => {
      await signOut();
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.brand}>Orbii</Text>
        <Text style={styles.eyebrow}>Settings</Text>
        <Text style={styles.title}>Capacity and account</Text>
        <Text style={styles.sub}>
          Tune daily focus size and where midnight falls for your streak.
        </Text>

        <SettingsCapacitySection
          capacity={user.capacity}
          busy={busy}
          onChange={handleCapacity}
        />

        <SettingsTimezoneSection
          key={user.timezone}
          timezone={user.timezone}
          deviceTimezone={deviceTz}
          busy={busy}
          onSave={handleTimezone}
        />

        <SettingsSignOutSection busy={busy} onSignOut={handleSignOut} />

        {error ? <Text style={styles.error}>{error}</Text> : null}
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
    gap: space[3],
    padding: space[6],
  },
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    padding: space[6],
    paddingBottom: space[12],
    gap: space[5],
  },
  brand: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  eyebrow: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: fontSize["2xl"],
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: fontSize.md,
    color: colors.muted,
    lineHeight: 22,
  },
  error: {
    color: colors.primaryDeep,
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
