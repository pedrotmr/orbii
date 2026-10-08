import { type Habit } from "@orbii/backend";
import { type Palette, radius, space } from "@orbii/tokens";
import { StyleSheet, View } from "react-native";
import { NestableDraggableFlatList } from "react-native-draggable-flatlist";
import { useThemedStyles } from "../../theme/use-theme";
import OrbitHabitRow from "./orbit-habit-row";

interface OrbitHabitListProps {
  habits: Habit[];
  busy: boolean;
  onRemove: (habitKey: string) => void;
  onEdit: (habitKey: string) => void;
  onReorder: (habitKeys: string[]) => void;
}

export default function OrbitHabitList({
  habits,
  busy,
  onRemove,
  onEdit,
  onReorder,
}: OrbitHabitListProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <NestableDraggableFlatList
      data={habits}
      keyExtractor={(habit) => habit.id}
      renderItem={({ item, drag, isActive }) => (
        <OrbitHabitRow
          habit={item}
          busy={busy}
          active={isActive}
          drag={drag}
          onEdit={onEdit}
          onRemove={onRemove}
        />
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      onDragEnd={({ data, from, to }) => {
        if (from !== to) {
          onReorder(data.map((habit) => habit.id));
        }
      }}
      activationDistance={8}
      scrollEnabled={false}
      style={styles.list}
    />
  );
}
const createStyles = (colors: Palette) =>
  StyleSheet.create({
    list: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      overflow: "visible",
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.line,
      marginLeft: 72,
      marginRight: space[3],
    },
  });
