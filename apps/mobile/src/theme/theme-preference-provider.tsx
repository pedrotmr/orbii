import type { ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { Appearance } from "react-native";
import {
  ThemePreferenceContext,
  themePreferences,
  type ThemePreference,
} from "./use-theme";

interface ThemePreferenceProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = "@orbii/theme-preference/v1";

const parseThemePreference = (value: string | null) => {
  return themePreferences.find((preference) => preference === value) ?? null;
};

const toColorScheme = (preference: ThemePreference) => {
  return preference === "system" ? "auto" : preference;
};

export default function ThemePreferenceProvider({
  children,
}: ThemePreferenceProviderProps) {
  const [preference, setPreference] = useState<ThemePreference>("system");
  const selectionVersion = useRef(0);

  useEffect(() => {
    let active = true;
    const initialVersion = selectionVersion.current;

    const loadPreference = async () => {
      try {
        const storedPreference = await AsyncStorage.getItem(STORAGE_KEY);
        const loadedPreference = parseThemePreference(storedPreference);
        if (
          !active ||
          selectionVersion.current !== initialVersion ||
          !loadedPreference
        ) {
          return;
        }

        setPreference(loadedPreference);
        Appearance.setColorScheme(toColorScheme(loadedPreference));
      } catch {
        return;
      }
    };

    void loadPreference();

    return () => {
      active = false;
    };
  }, []);

  const updatePreference = useCallback(
    async (nextPreference: ThemePreference) => {
      selectionVersion.current += 1;
      setPreference(nextPreference);
      Appearance.setColorScheme(toColorScheme(nextPreference));
      await AsyncStorage.setItem(STORAGE_KEY, nextPreference);
    },
    [],
  );

  return (
    <ThemePreferenceContext.Provider
      value={{ preference, setPreference: updatePreference }}
    >
      {children}
    </ThemePreferenceContext.Provider>
  );
}
