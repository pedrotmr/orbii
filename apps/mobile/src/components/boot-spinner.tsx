import { colors } from "@orbii/tokens";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function BootSpinner() {
  return (
    <View style={styles.boot}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
});
