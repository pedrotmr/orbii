import { colors, fontSize, space } from "@orbii/tokens";
import { StyleSheet, Text, View } from "react-native";
import PrimaryButton from "../../components/primary-button";

interface SetupWelcomeStepProps {
  onContinue: () => void;
}

export default function SetupWelcomeStep({
  onContinue,
}: SetupWelcomeStepProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>Welcome</Text>
      <Text style={styles.title}>Your Orbit holds more than today</Text>
      <Text style={styles.body}>
        Orbit is the habits you want in your life. Today’s Orbit is a small set
        you actually take on — success is finishing that set, not covering
        everything.
      </Text>
      <PrimaryButton label="Build my Orbit" onPress={onContinue} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[3], flex: 1, justifyContent: "center" },
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
  body: {
    fontSize: fontSize.md,
    color: colors.muted,
    lineHeight: 22,
    marginBottom: space[2],
  },
});
