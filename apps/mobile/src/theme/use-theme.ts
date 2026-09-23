import { darkColors, lightColors, type Palette } from "@orbii/tokens";
import { useMemo } from "react";
import { useColorScheme } from "react-native";

export const useTheme = () => {
  const scheme: "dark" | "light" =
    useColorScheme() === "dark" ? "dark" : "light";
  return { scheme, colors: scheme === "dark" ? darkColors : lightColors };
};

export const useThemedStyles = <T>(createStyles: (colors: Palette) => T) => {
  const { colors } = useTheme();
  return useMemo(() => createStyles(colors), [colors, createStyles]);
};
