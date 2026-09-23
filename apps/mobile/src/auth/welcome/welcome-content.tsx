import { type Palette, space } from "@orbii/tokens";
import { StyleSheet, Text, View } from "react-native";
import BrandMark from "../../components/brand-mark";
import GhostButton from "../../components/ghost-button";
import ScreenScaffold from "../../components/layout/screen-scaffold";
import PrimaryButton from "../../components/primary-button";
import OrbitIllustration from "../../components/ritual/orbit-illustration";
import InlineError from "../../components/states/inline-error";
import { useThemedStyles } from "../../theme/use-theme";

interface WelcomeContentProps {
  busy: boolean;
  error: string | null;
  onGoogle: () => void;
  onApple: () => void;
  onEmail: () => void;
}

export default function WelcomeContent({
  busy,
  error,
  onGoogle,
  onApple,
  onEmail,
}: WelcomeContentProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <ScreenScaffold>
      <BrandMark large />
      <OrbitIllustration />
      <View style={styles.copy}>
        <Text accessibilityRole="header" style={styles.title}>
          {"Good habits.\nA little at a time."}
        </Text>
        <Text style={styles.sub}>
          Keep a life full of good things. Make space for just a few each day.
        </Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton
          label={busy ? "Opening…" : "Continue with Google"}
          disabled={busy}
          onPress={onGoogle}
        />
        <PrimaryButton
          label="Continue with Apple"
          variant="outlined"
          disabled={busy}
          onPress={onApple}
        />
        <GhostButton
          label="Continue with email"
          disabled={busy}
          onPress={onEmail}
        />
        {error ? <InlineError message={error} /> : null}
        <Text style={styles.note}>Your Orbit, with you on every device.</Text>
      </View>
    </ScreenScaffold>
  );
}
const createStyles = (colors: Palette) =>
  StyleSheet.create({
    copy: { gap: space[3] },
    title: {
      fontSize: 36,
      lineHeight: 41,
      fontWeight: "700",
      color: colors.ink,
      letterSpacing: -1,
    },
    sub: { fontSize: 17, lineHeight: 25, color: colors.muted, maxWidth: 320 },
    actions: { marginTop: "auto", gap: space[3], paddingTop: space[3] },
    note: {
      fontSize: 13,
      color: colors.muted,
      textAlign: "center",
      lineHeight: 20,
    },
  });
