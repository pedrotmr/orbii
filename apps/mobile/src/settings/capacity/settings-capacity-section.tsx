import Ionicons from "@expo/vector-icons/Ionicons";
import { type Palette, radius, space } from "@orbii/tokens";
import { StyleSheet, Text, View } from "react-native";
import CapacityPicker from "../../components/controls/capacity-picker";
import { useTheme, useThemedStyles } from "../../theme/use-theme";

interface SettingsCapacitySectionProps {
  capacity: number;
  busy: boolean;
  onChange: (capacity: number) => void;
}

export default function SettingsCapacitySection({
  capacity,
  busy,
  onChange,
}: SettingsCapacitySectionProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.icon}>
          <Ionicons
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            name="ellipse-outline"
            size={23}
            color={colors.primary}
          />
        </View>
        <Text style={styles.label}>Daily capacity</Text>
        <CapacityPicker value={capacity} disabled={busy} onChange={onChange} />
      </View>
      <Text style={styles.hint}>
        Choose a maximum that feels manageable. Changes apply the next time you
        choose your focus.
      </Text>
    </View>
  );
}
const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: { gap: space[3] },
    row: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: space[2],
      backgroundColor: colors.surface,
      padding: space[3],
      borderRadius: radius.lg,
    },
    icon: { padding: space[2] },
    label: {
      flex: 1,
      minWidth: 100,
      fontSize: 16,
      fontWeight: "500",
      color: colors.ink,
    },
    hint: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 21,
      paddingHorizontal: space[4],
    },
  });
