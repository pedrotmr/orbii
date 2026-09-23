import { DEFAULT_CAPACITY } from "@orbii/backend";
import { type Palette, radius, space } from "@orbii/tokens";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import CapacityPicker from "../../components/controls/capacity-picker";
import PrimaryButton from "../../components/primary-button";
import FocusOrbit from "../../components/ritual/focus-orbit";
import { useThemedStyles } from "../../theme/use-theme";

interface SetupCapacityStepProps {
  busy: boolean;
  onFinish: (capacity: number) => void;
}

export default function SetupCapacityStep({
  busy,
  onFinish,
}: SetupCapacityStepProps) {
  const styles = useThemedStyles(createStyles);
  const [capacity, setCapacity] = useState(DEFAULT_CAPACITY);
  return (
    <View style={styles.wrap}>
      <Text accessibilityRole="header" style={styles.title}>
        Find your pace.
      </Text>
      <Text style={styles.body}>
        How many habits can fit in a day? Start small. You can always change
        this later.
      </Text>
      <FocusOrbit total={capacity} />
      <View style={styles.choice}>
        <Text style={styles.label}>Daily capacity</Text>
        <CapacityPicker
          value={capacity}
          disabled={busy}
          onChange={setCapacity}
        />
      </View>
      <PrimaryButton
        label={busy ? "Getting ready…" : "Open Today"}
        disabled={busy}
        onPress={() => onFinish(capacity)}
      />
    </View>
  );
}
const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: { flexGrow: 1, gap: space[4] },
    title: {
      fontSize: 34,
      lineHeight: 40,
      fontWeight: "700",
      color: colors.ink,
      letterSpacing: -1,
    },
    body: { color: colors.muted, fontSize: 17, lineHeight: 25 },
    choice: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: space[2],
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: space[4],
      marginTop: "auto",
    },
    label: { color: colors.ink, fontSize: 16, fontWeight: "500" },
  });
