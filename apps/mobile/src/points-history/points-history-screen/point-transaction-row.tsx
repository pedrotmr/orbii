import { type Palette, radius, space } from "@orbii/tokens";
import { StyleSheet, Text, View } from "react-native";
import type { PointTransaction } from "../points-history-types";
import { useThemedStyles } from "../../theme/use-theme";

interface PointTransactionRowProps {
  transaction: PointTransaction;
}

const localDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const formatLocalDate = (localDate: string) => {
  return localDateFormatter.format(new Date(`${localDate}T12:00:00.000Z`));
};

export default function PointTransactionRow({
  transaction,
}: PointTransactionRowProps) {
  const styles = useThemedStyles(createStyles);
  const amount = transaction.amount.toLocaleString();
  const signedAmount = transaction.amount > 0 ? `+${amount}` : amount;

  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text selectable style={styles.name}>
          {transaction.sourceName}
        </Text>
        <Text selectable style={styles.date}>
          {formatLocalDate(transaction.localDate)}
        </Text>
      </View>
      <Text
        accessibilityLabel={`${signedAmount} points`}
        selectable
        style={[
          styles.amount,
          transaction.amount > 0 ? styles.earned : styles.spent,
        ]}
      >
        {signedAmount} pts
      </Text>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[4],
      padding: space[4],
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
    },
    copy: { flex: 1, gap: space[1] },
    name: { color: colors.ink, fontSize: 16, fontWeight: "600" },
    date: { color: colors.muted, fontSize: 13 },
    amount: {
      fontSize: 16,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
    },
    earned: { color: colors.primary },
    spent: { color: colors.ink },
  });
