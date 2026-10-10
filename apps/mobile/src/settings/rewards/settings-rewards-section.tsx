import Ionicons from "@expo/vector-icons/Ionicons";
import { type Palette, radius, space } from "@orbii/tokens";
import { StyleSheet, Switch, Text, View } from "react-native";
import { useTheme, useThemedStyles } from "../../theme/use-theme";

interface SettingsRewardsSectionProps {
  visible: boolean;
  busy: boolean;
  onChange: (visible: boolean) => void;
}

export default function SettingsRewardsSection({
  visible,
  busy,
  onChange,
}: SettingsRewardsSectionProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Ionicons
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          name="gift-outline"
          size={23}
          color={colors.primary}
        />
        <View style={styles.copy}>
          <Text style={styles.label}>Rewards</Text>
          <Text style={styles.description}>Show a dedicated Rewards tab</Text>
        </View>
        <Switch
          accessibilityRole="switch"
          accessibilityLabel="Rewards tab"
          disabled={busy}
          value={visible}
          onValueChange={onChange}
          trackColor={{ false: colors.disabled, true: colors.accent }}
          thumbColor={visible ? colors.surface : colors.muted}
          ios_backgroundColor={colors.disabled}
        />
      </View>
      <Text style={styles.hint}>
        Hiding the tab keeps your rewards and point balance saved.
      </Text>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: { gap: space[3] },
    row: {
      minHeight: 82,
      flexDirection: "row",
      alignItems: "center",
      gap: space[4],
      padding: space[5],
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
    },
    copy: { flex: 1, gap: space[1] },
    label: { color: colors.ink, fontSize: 16, fontWeight: "600" },
    description: { color: colors.muted, fontSize: 14, lineHeight: 20 },
    hint: {
      paddingHorizontal: space[4],
      color: colors.muted,
      fontSize: 14,
      lineHeight: 21,
    },
  });
