import { useSSO } from "@clerk/expo";
import { useHostedAuth } from "@clerk/expo/hosted-auth";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import WelcomeContent from "./welcome/welcome-content";

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
    <WelcomeContent
      busy={busy}
      error={error}
      onGoogle={() => void runSSO("oauth_google")}
      onApple={() => void runSSO("oauth_apple")}
      onEmail={() => void runHosted("sign-in")}
    />
  );
}
