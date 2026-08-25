import { colors } from "@orbii/tokens";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import AuthWelcomeScreen from "./src/auth/auth-welcome-screen";
import { discardSliceClientUserId } from "./src/discard-slice-identity";
import RitualScreen from "./src/ritual/ritual-screen";

export default function App() {
  useEffect(() => {
    void discardSliceClientUserId();
  }, []);

  return (
    <>
      <AuthLoading>
        <View style={styles.boot}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </AuthLoading>
      <Unauthenticated>
        <AuthWelcomeScreen />
      </Unauthenticated>
      <Authenticated>
        <RitualScreen />
      </Authenticated>
    </>
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
