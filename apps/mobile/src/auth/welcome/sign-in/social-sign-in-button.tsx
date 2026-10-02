import { fontSize, radius, signInColors, space } from "@orbii/tokens";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { SignInProvider } from "../../sign-in-provider";
import { selectionFeedback } from "../../../components/controls/feedback";
import AppleLogo from "./logos/apple-logo";
import GoogleLogo from "./logos/google-logo";

interface SocialSignInButtonProps {
  provider: SignInProvider;
  pending: boolean;
  disabled: boolean;
  onPress: () => void;
}

const GOOGLE_LOGO_SIZE = 18;
/** The Apple glyph sits low and padded inside its box, so it draws larger and lifts to match the G. */
const APPLE_LOGO_SIZE = 30;

export default function SocialSignInButton({
  provider,
  pending,
  disabled,
  onPress,
}: SocialSignInButtonProps) {
  const isApple = provider === "apple";
  const label = isApple ? "Continue with Apple" : "Continue with Google";
  const labelColor = isApple ? signInColors.onApple : signInColors.onGoogle;
  const logo = isApple ? (
    <View style={styles.appleLogo}>
      <AppleLogo size={APPLE_LOGO_SIZE} color={labelColor} />
    </View>
  ) : (
    <GoogleLogo size={GOOGLE_LOGO_SIZE} />
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy: pending }}
      disabled={disabled}
      onPress={() => {
        selectionFeedback();
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        isApple ? styles.apple : styles.google,
        disabled && !pending && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {pending ? <ActivityIndicator color={labelColor} /> : logo}
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space[3],
    paddingHorizontal: space[5],
    borderRadius: radius.full,
    borderCurve: "continuous",
  },
  apple: { backgroundColor: signInColors.apple },
  google: {
    backgroundColor: signInColors.google,
    borderWidth: 1,
    borderColor: signInColors.googleStroke,
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  appleLogo: { transform: [{ translateY: -2.5 }] },
  label: { fontSize: fontSize.md, fontWeight: "500" },
});
