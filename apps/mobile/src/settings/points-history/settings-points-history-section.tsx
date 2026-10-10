import Ionicons from "@expo/vector-icons/Ionicons";
import { type Palette, radius, space } from "@orbii/tokens";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme, useThemedStyles } from "../../theme/use-theme";

interface SettingsPointsHistorySectionProps {
  onOpen: () => void;
}

export default function SettingsPointsHistorySection({
  onOpen,
}: SettingsPointsHistorySectionProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Points history"
      onPress={onOpen}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Ionicons
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        name="receipt-outline"
        size={23}
        color={colors.primary}
      />
      <View style={styles.copy}>
        <Text style={styles.label}>Points history</Text>
        <Text style={styles.description}>See every point earned and spent</Text>
      </View>
      <Ionicons
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        name="chevron-forward"
        size={18}
        color={colors.muted}
      />
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[4],
      minHeight: 82,
      padding: space[5],
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
    },
    copy: { flex: 1, gap: space[1] },
    label: { color: colors.ink, fontSize: 16, fontWeight: "600" },
    description: { color: colors.muted, fontSize: 14, lineHeight: 20 },
    pressed: { backgroundColor: colors.bgMid },
  });
