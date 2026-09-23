import { type Palette, space } from "@orbii/tokens";
import { ArrowLeftIcon } from "phosphor-react-native/src/icons/ArrowLeft";
import { XIcon } from "phosphor-react-native/src/icons/X";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme, useThemedStyles } from "../../../theme/use-theme";

interface HabitSheetHeaderProps {
  choosingIcon: boolean;
  busy: boolean;
  onBack: () => void;
  onClose: () => void;
}

export default function HabitSheetHeader({
  choosingIcon,
  busy,
  onBack,
  onClose,
}: HabitSheetHeaderProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.header}>
      {choosingIcon ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to habit"
          onPress={onBack}
          style={styles.control}
        >
          <ArrowLeftIcon size={24} color={colors.ink} />
        </Pressable>
      ) : null}
      <Text accessibilityRole="header" style={styles.title}>
        {choosingIcon ? "Choose an icon" : "New habit"}
      </Text>
      {choosingIcon ? (
        <View style={styles.control} />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close habit creation"
          accessibilityState={{ disabled: busy }}
          disabled={busy}
          onPress={onClose}
          style={styles.control}
        >
          <XIcon size={22} color={colors.muted} />
        </Pressable>
      )}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: space[4],
      paddingTop: space[3],
      paddingBottom: space[2],
      gap: space[2],
    },
    title: {
      flex: 1,
      fontSize: 21,
      fontWeight: "600",
      color: colors.ink,
      paddingLeft: space[2],
    },
    control: {
      width: 48,
      height: 48,
      alignItems: "center",
      justifyContent: "center",
    },
  });
