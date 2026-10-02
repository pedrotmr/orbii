import { fontSize, type Palette, radius, space } from "@orbii/tokens";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { SignInProvider } from "../../sign-in-provider";
import { selectionFeedback } from "../../../components/controls/feedback";
import { useTheme, useThemedStyles } from "../../../theme/use-theme";
import AppleLogo from "./logos/apple-logo";
import GoogleLogo from "./logos/google-logo";

interface SocialSignInButtonProps {
  provider: SignInProvider;
  pending: boolean;
  disabled: boolean;
  onPress: () => void;
}

const GOOGLE_LOGO_SIZE = 20;
/** The Apple glyph is padded inside its box, so it draws larger to match the G. */
const APPLE_LOGO_SIZE = 24;

export default function SocialSignInButton({
  provider,
  pending,
  disabled,
  onPress,
}: SocialSignInButtonProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const isApple = provider === "apple";
  const label = isApple ? "Continue with Apple" : "Continue with Google";
  const labelColor = isApple ? colors.onAppleButton : colors.onGoogleButton;
  const logo = isApple ? (
    <AppleLogo size={APPLE_LOGO_SIZE} color={labelColor} />
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
      <View style={styles.logo}>
        {pending ? <ActivityIndicator color={labelColor} /> : logo}
      </View>
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
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
    apple: { backgroundColor: colors.appleButton },
    google: {
      backgroundColor: colors.googleButton,
      borderWidth: 1,
      borderColor: colors.googleButtonStroke,
    },
    disabled: { opacity: 0.5 },
    pressed: { opacity: 0.85 },
    logo: {
      width: APPLE_LOGO_SIZE,
      height: APPLE_LOGO_SIZE,
      alignItems: "center",
      justifyContent: "center",
    },
    label: { fontSize: fontSize.md, fontWeight: "500" },
  });
