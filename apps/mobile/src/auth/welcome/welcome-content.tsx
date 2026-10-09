import { type Palette, space } from "@orbii/tokens";
import { StyleSheet, Text, View } from "react-native";
import type { SignInProvider } from "../sign-in-provider";
import BrandMark from "../../components/brand-mark";
import ScreenScaffold from "../../components/layout/screen-scaffold";
import OrbitIllustration from "../../components/ritual/orbit-illustration";
import InlineError from "../../components/states/inline-error";
import { useThemedStyles } from "../../theme/use-theme";
import SocialSignInButton from "./sign-in/social-sign-in-button";

interface WelcomeContentProps {
  pendingProvider: SignInProvider | null;
  error: string | null;
  onSignIn: (provider: SignInProvider) => void;
}

const PROVIDERS: SignInProvider[] = ["apple", "google"];

export default function WelcomeContent({
  pendingProvider,
  error,
  onSignIn,
}: WelcomeContentProps) {
  const styles = useThemedStyles(createStyles);

  const busy = pendingProvider !== null;
  return (
    <ScreenScaffold>
      <BrandMark large />
      <OrbitIllustration />
      <View style={styles.copy}>
        <Text style={styles.tagline}>Come back to what matters.</Text>
        <Text accessibilityRole="header" style={styles.title}>
          {"Good habits.\nA little at a time."}
        </Text>
        <Text style={styles.sub}>
          Keep a life full of good things. Make space for just a few each day.
        </Text>
      </View>
      <View style={styles.actions}>
        {PROVIDERS.map((provider) => (
          <SocialSignInButton
            key={provider}
            provider={provider}
            pending={pendingProvider === provider}
            disabled={busy}
            onPress={() => onSignIn(provider)}
          />
        ))}
        {error ? <InlineError message={error} /> : null}
      </View>
    </ScreenScaffold>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    copy: { gap: space[3] },
    tagline: { fontSize: 15, fontWeight: "600", color: colors.accent },
    title: {
      fontSize: 36,
      lineHeight: 41,
      fontWeight: "700",
      color: colors.ink,
      letterSpacing: -1,
    },
    sub: { fontSize: 17, lineHeight: 25, color: colors.muted, maxWidth: 320 },
    actions: { marginTop: "auto", gap: space[3], paddingTop: space[3] },
  });
