import { darkColors, lightColors, type Palette } from "@orbii/tokens";
import { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";

export const themePreferences = ["system", "light", "dark"] as const;
export type ThemePreference = (typeof themePreferences)[number];

interface ThemePreferenceContextValue {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => Promise<void>;
}

export const ThemePreferenceContext =
  createContext<ThemePreferenceContextValue>({
    preference: "system",
    setPreference: async () => undefined,
  });

export const useThemePreference = () => useContext(ThemePreferenceContext);

export const useTheme = () => {
  const scheme: "dark" | "light" =
    useColorScheme() === "dark" ? "dark" : "light";
  return { scheme, colors: scheme === "dark" ? darkColors : lightColors };
};

export const useThemedStyles = <T>(createStyles: (colors: Palette) => T) => {
  const { colors } = useTheme();
  return useMemo(() => createStyles(colors), [colors, createStyles]);
};
