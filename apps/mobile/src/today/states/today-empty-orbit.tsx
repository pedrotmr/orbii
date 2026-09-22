import { type Palette, space } from "@orbii/tokens";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import PrimaryButton from "../../components/primary-button";
import { useThemedStyles } from "../../theme/use-theme";

export default function TodayEmptyOrbit() {
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  return (
    <View style={styles.block}>
      <Text accessibilityRole="header" style={styles.title}>
        Make room for something good.
      </Text>
      <Text style={styles.sub}>
        Add your first habit to start finding your daily focus.
      </Text>
      <PrimaryButton
        label="Build my Orbit"
        onPress={() => router.replace("/setup")}
      />
    </View>
  );
}
const createStyles = (colors: Palette) =>
  StyleSheet.create({
    block: { gap: space[4] },
    title: {
      fontSize: 30,
      fontWeight: "700",
      color: colors.ink,
      letterSpacing: -0.7,
    },
    sub: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  });
