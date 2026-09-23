import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { convex } from "../src/convexClient";
import { discardSliceClientUserId } from "../src/discard-slice-identity";
import { useTheme } from "../src/theme/use-theme";

void SplashScreen.preventAutoHideAsync();

const publishableKey = (() => {
  const key = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error(
      "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is missing. Run `clerk env pull` from apps/mobile.",
    );
  }

  return key;
})();

export default function RootLayout() {
  const { colors, scheme } = useTheme();
  const navigationTheme = scheme === "dark" ? DarkTheme : DefaultTheme;
  const statusBarStyle = scheme === "dark" ? "light" : "dark";
  useEffect(() => {
    void discardSliceClientUserId();
  }, []);

  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <SafeAreaProvider>
          <ThemeProvider
            value={{
              ...navigationTheme,
              colors: {
                ...navigationTheme.colors,
                background: colors.bg,
                card: colors.bg,
                text: colors.ink,
                primary: colors.primary,
                border: colors.line,
              },
            }}
          >
            <Stack
              screenOptions={{
                headerShown: false,
                ...(process.env.EXPO_OS === "android"
                  ? { statusBarStyle }
                  : {}),
                contentStyle: { backgroundColor: colors.bg },
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="welcome" />
              <Stack.Screen name="setup" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="habit-create"
                options={{
                  ...(process.env.EXPO_OS === "ios"
                    ? { presentation: "modal" }
                    : {
                        presentation: "formSheet",
                        sheetAllowedDetents: [0.9, 1],
                        sheetGrabberVisible: true,
                      }),
                  contentStyle: { backgroundColor: colors.surface },
                }}
              />
            </Stack>
          </ThemeProvider>
        </SafeAreaProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
