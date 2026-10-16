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
  const [isReady, setIsReady] = useState(false);
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
      } finally {
        if (active) {
          setIsReady(true);
        }
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
      await AsyncStorage.setItem(STORAGE_KEY, nextPreference);
      setPreference(nextPreference);
      Appearance.setColorScheme(toColorScheme(nextPreference));
    },
    [],
  );

  if (!isReady) {
    return null;
  }

  return (
    <ThemePreferenceContext.Provider
      value={{ preference, setPreference: updatePreference }}
    >
      {children}
    </ThemePreferenceContext.Provider>
  );
}
