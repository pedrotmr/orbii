import { useSSO } from "@clerk/expo";
import { useHostedAuth } from "@clerk/expo/hosted-auth";
import { colors, fontSize, space } from "@orbii/tokens";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import BrandMark from "../components/brand-mark";
import GhostButton from "../components/ghost-button";
import PrimaryButton from "../components/primary-button";
import ScreenAtmosphere from "../components/screen-atmosphere";

WebBrowser.maybeCompleteAuthSession();

const redirectUrl = AuthSession.makeRedirectUri({
  scheme: "orbii",
  path: "oauth-callback",
});

export default function AuthWelcomeScreen() {
  const { startSSOFlow } = useSSO();
  const { startHostedAuth } = useHostedAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const runSSO = async (strategy: "oauth_google" | "oauth_apple") => {
    try {
      setBusy(true);
      setError(null);
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy,
        redirectUrl,
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  const runHosted = async (mode: "sign-in" | "sign-up") => {
    try {
      setBusy(true);
      setError(null);
      await startHostedAuth({ mode });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenAtmosphere>
      <View style={styles.container}>
        <BrandMark large />
        <Text style={styles.title}>Sign in to continue</Text>
        <Text style={styles.sub}>
          Orbii needs an account. No account means no app — trusted users only
          for V1.
        </Text>
        <PrimaryButton
          label={busy ? "Opening…" : "Continue with Google"}
          disabled={busy}
          onPress={() => void runSSO("oauth_google")}
        />
        <PrimaryButton
          label={busy ? "Opening…" : "Continue with Apple"}
          disabled={busy}
          onPress={() => void runSSO("oauth_apple")}
        />
        <GhostButton
          label="Email instead"
          disabled={busy}
          onPress={() => void runHosted("sign-in")}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </ScreenAtmosphere>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: space[6],
    gap: space[3],
  },
  title: {
    fontSize: fontSize["2xl"],
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.6,
  },
  sub: {
    fontSize: fontSize.md,
    color: colors.muted,
    lineHeight: 22,
    marginBottom: space[2],
  },
  error: {
    color: colors.primaryDeep,
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
