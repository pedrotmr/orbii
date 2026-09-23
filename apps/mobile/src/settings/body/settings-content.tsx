import { type Palette, space } from "@orbii/tokens";
import { StyleSheet, Text, View } from "react-native";
import ScreenScaffold from "../../components/layout/screen-scaffold";
import InlineError from "../../components/states/inline-error";
import { useThemedStyles } from "../../theme/use-theme";
import SettingsSignOutSection from "../account/settings-sign-out-section";
import SettingsCapacitySection from "../capacity/settings-capacity-section";
import SettingsTimezoneSection from "../timezone/settings-timezone-section";

interface SettingsContentProps {
  capacity: number;
  timezone: string;
  deviceTimezone: string;
  busy: boolean;
  error: string | null;
  onCapacity: (value: number) => void;
  onTimezone: (value: string) => Promise<boolean>;
  onSignOut: () => void;
}

export default function SettingsContent({
  capacity,
  timezone,
  deviceTimezone,
  busy,
  error,
  onCapacity,
  onTimezone,
  onSignOut,
}: SettingsContentProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <ScreenScaffold tabbed>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>
          Your pace.
        </Text>
        <Text style={styles.sub}>A few preferences to make Orbii yours.</Text>
      </View>
      <Text style={styles.section}>Daily focus</Text>
      <SettingsCapacitySection
        capacity={capacity}
        busy={busy}
        onChange={onCapacity}
      />
      <SettingsTimezoneSection
        key={timezone}
        timezone={timezone}
        deviceTimezone={deviceTimezone}
        busy={busy}
        onSave={onTimezone}
      />
      <SettingsSignOutSection busy={busy} onSignOut={onSignOut} />
      {error ? <InlineError message={error} /> : null}
      <Text style={styles.footer}>
        Orbii<Text style={styles.footerSub}> · A little, every day.</Text>
      </Text>
    </ScreenScaffold>
  );
}
const createStyles = (colors: Palette) =>
  StyleSheet.create({
    heading: { gap: space[2], marginBottom: space[2] },
    title: {
      fontSize: 34,
      lineHeight: 40,
      fontWeight: "700",
      color: colors.ink,
      letterSpacing: -1,
    },
    sub: { color: colors.muted, fontSize: 16, lineHeight: 24 },
    section: {
      color: colors.muted,
      fontSize: 14,
      fontWeight: "500",
      paddingHorizontal: space[4],
      marginBottom: -space[3],
    },
    footer: {
      marginTop: "auto",
      paddingTop: space[10],
      textAlign: "center",
      fontSize: 14,
      color: colors.muted,
      fontWeight: "600",
    },
    footerSub: { fontWeight: "400" },
  });
