import { type Palette, space } from "@orbii/tokens";
import { StyleSheet, Text, View } from "react-native";
import BrandMark from "../../components/brand-mark";
import { useThemedStyles } from "../../theme/use-theme";

interface TodayHeaderProps {
  localDate: string;
}

export default function TodayHeader({ localDate }: TodayHeaderProps) {
  const styles = useThemedStyles(createStyles);
  const date = new Date(`${localDate}T12:00:00`);
  const label = date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return (
    <View style={styles.row}>
      <BrandMark />
      <Text style={styles.date}>{label}</Text>
    </View>
  );
}
const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: space[3],
      flexWrap: "wrap",
      paddingBottom: space[2],
    },
    date: { fontSize: 13, fontWeight: "500", color: colors.muted },
  });
