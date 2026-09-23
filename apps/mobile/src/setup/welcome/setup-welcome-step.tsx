import { type Palette, space } from "@orbii/tokens";
import { StyleSheet, Text, View } from "react-native";
import PrimaryButton from "../../components/primary-button";
import OrbitIllustration from "../../components/ritual/orbit-illustration";
import { useThemedStyles } from "../../theme/use-theme";

interface SetupWelcomeStepProps {
  onContinue: () => void;
}

export default function SetupWelcomeStep({
  onContinue,
}: SetupWelcomeStepProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.wrap}>
      <Text accessibilityRole="header" style={styles.title}>
        {"A full life.\nA lighter list."}
      </Text>
      <Text style={styles.body}>
        Keep the habits you care about in your Orbit. Each day, choose a small
        focus from a handful of options.
      </Text>
      <OrbitIllustration />
      <Text style={styles.note}>Finish your focus. That’s a day complete.</Text>
      <PrimaryButton label="Build my Orbit" onPress={onContinue} />
    </View>
  );
}
const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: { flexGrow: 1, gap: space[4] },
    title: {
      fontSize: 34,
      lineHeight: 39,
      fontWeight: "700",
      color: colors.ink,
      letterSpacing: -1,
    },
    body: { color: colors.muted, fontSize: 17, lineHeight: 25 },
    note: {
      marginTop: "auto",
      color: colors.ink,
      fontSize: 15,
      lineHeight: 22,
      textAlign: "center",
    },
  });
