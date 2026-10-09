import type { ReactElement } from "react";
import { type Habit } from "@orbii/backend";
import { type Palette, space } from "@orbii/tokens";
import { useCallback } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated, { useAnimatedRef } from "react-native-reanimated";
import Sortable, { type SortableGridRenderItem } from "react-native-sortables";
import { useThemedStyles } from "../../theme/use-theme";
import OrbitHabitRow from "./orbit-habit-row";

interface OrbitHabitListProps {
  habits: Habit[];
  busy: boolean;
  header: ReactElement;
  footer: ReactElement;
  onRemove: (habitKey: string) => void;
  onEdit: (habitKey: string) => void;
  onReorder: (habitKeys: string[]) => void;
}

export default function OrbitHabitList({
  habits,
  busy,
  header,
  footer,
  onRemove,
  onEdit,
  onReorder,
}: OrbitHabitListProps) {
  const styles = useThemedStyles(createStyles);
  const scrollableRef = useAnimatedRef<ScrollView>();
  const renderItem = useCallback<SortableGridRenderItem<Habit>>(
    ({ item, index }) => (
      <OrbitHabitRow
        habit={item}
        busy={busy}
        first={index === 0}
        last={index === habits.length - 1}
        onEdit={onEdit}
        onRemove={onRemove}
      />
    ),
    [busy, habits.length, onEdit, onRemove],
  );

  return (
    <Animated.ScrollView
      ref={scrollableRef}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.container}
    >
      <View style={styles.header}>{header}</View>
      <View style={styles.grid}>
        <Sortable.Grid
          activeItemScale={1.02}
          activeItemShadowOpacity={0.12}
          columns={1}
          columnGap={0}
          data={habits}
          dragActivationDelay={180}
          dragActivationFailOffset={24}
          hapticsEnabled
          inactiveItemOpacity={1}
          keyExtractor={(habit) => habit.id}
          onDragEnd={({ data, fromIndex, toIndex }) => {
            if (fromIndex !== toIndex) {
              onReorder(data.map((habit) => habit.id));
            }
          }}
          overDrag="none"
          renderItem={renderItem}
          rowGap={0}
          scrollableRef={scrollableRef}
          showDropIndicator={false}
          sortEnabled={!busy}
          strategy="insert"
        />
      </View>
      <View style={styles.footer}>{footer}</View>
    </Animated.ScrollView>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: {
      flexGrow: 1,
      width: "100%",
      maxWidth: 560,
      alignSelf: "center",
      paddingHorizontal: space[6],
      paddingTop: space[4],
      paddingBottom: space[6],
    },
    header: { marginBottom: space[6] },
    grid: { width: "100%" },
    footer: { marginTop: space[6] },
  });
