import { colors, fontSize, radius, space } from "@orbii/tokens";
import { StyleSheet } from "react-native";

export const todayHabitStyles = StyleSheet.create({
  list: { gap: space[2], marginTop: space[2] },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingVertical: space[4],
    paddingHorizontal: space[5],
    borderWidth: 1,
    borderColor: colors.line,
  },
  rowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  rowDone: {
    borderColor: colors.success,
    backgroundColor: colors.successSoft,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  glyph: { fontSize: fontSize.lg, width: 28, textAlign: "center" },
  rowLabel: { fontSize: fontSize.lg, fontWeight: "600", color: colors.ink },
});
