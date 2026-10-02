import { useSSO } from "@clerk/expo";
import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import type { SignInProvider } from "./sign-in-provider";
import WelcomeContent from "./welcome/welcome-content";

WebBrowser.maybeCompleteAuthSession();

const configuredScheme = Constants.expoConfig?.scheme;
const appScheme =
  typeof configuredScheme === "string"
    ? configuredScheme
    : configuredScheme?.[0];

const redirectUrl = AuthSession.makeRedirectUri({
  scheme: appScheme,
  path: "oauth-callback",
});

export default function AuthWelcomeScreen() {
  const { startSSOFlow } = useSSO();
  const [error, setError] = useState<string | null>(null);
  const [pendingProvider, setPendingProvider] = useState<SignInProvider | null>(
    null,
  );

  const signIn = async (provider: SignInProvider) => {
    try {
      setPendingProvider(provider);
      setError(null);
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: `oauth_${provider}`,
        redirectUrl,
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setPendingProvider(null);
    }
  };

  return (
    <WelcomeContent
      pendingProvider={pendingProvider}
      error={error}
      onSignIn={(provider) => void signIn(provider)}
    />
  );
}
