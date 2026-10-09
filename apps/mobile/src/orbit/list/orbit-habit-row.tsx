import Ionicons from "@expo/vector-icons/Ionicons";
import { type Habit } from "@orbii/backend";
import { type Palette, radius, space } from "@orbii/tokens";
import { useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { selectionFeedback } from "../../components/controls/feedback";
import HabitIcon from "../../components/habits/habit-icon";
import { useTheme, useThemedStyles } from "../../theme/use-theme";

interface OrbitHabitRowProps {
  habit: Habit;
  busy: boolean;
  first: boolean;
  last: boolean;
  onEdit: (habitKey: string) => void;
  onRemove: (habitKey: string) => void;
}

export default function OrbitHabitRow({
  habit,
  busy,
  first,
  last,
  onEdit,
  onRemove,
}: OrbitHabitRowProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [swipeOpen, setSwipeOpen] = useState(false);
  const swipeGestureStarted = useRef(false);

  const confirmRemove = () => {
    Alert.alert(
      "Remove habit?",
      `Remove “${habit.name}” from your Orbit? This can’t be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => onRemove(habit.id),
        },
      ],
    );
  };

  return (
    <View style={[styles.row, first && styles.first, last && styles.last]}>
      <ReanimatedSwipeable
        containerStyle={styles.swipeable}
        enabled={!busy}
        rightThreshold={42}
        overshootRight={false}
        childrenContainerStyle={styles.swipeableContent}
        renderRightActions={() => (
          <View
            accessibilityElementsHidden={!swipeOpen}
            importantForAccessibility={
              swipeOpen ? "auto" : "no-hide-descendants"
            }
            style={styles.removeAction}
          >
            <Pressable
              accessibilityHint="Shows a confirmation before removing this habit"
              accessibilityLabel={`Remove ${habit.name}`}
              accessibilityRole="button"
              disabled={busy}
              onPress={() => {
                selectionFeedback();
                confirmRemove();
              }}
              style={({ pressed }) => [
                styles.removeActionContent,
                pressed && !busy && styles.pressed,
              ]}
            >
              <Ionicons
                accessible={false}
                importantForAccessibility="no-hide-descendants"
                name="trash-outline"
                size={23}
                color={colors.onDanger}
              />
            </Pressable>
          </View>
        )}
        onSwipeableOpenStartDrag={() => {
          swipeGestureStarted.current = true;
        }}
        onSwipeableCloseStartDrag={() => {
          swipeGestureStarted.current = true;
        }}
        onSwipeableOpen={() => {
          setSwipeOpen(true);
          selectionFeedback();
        }}
        onSwipeableClose={() => setSwipeOpen(false)}
      >
        <Pressable
          accessibilityLabel={`Edit ${habit.name}`}
          accessibilityHint="Tap to edit, or press and hold anywhere to reorder"
          accessibilityRole="button"
          accessibilityState={{ disabled: busy }}
          disabled={busy}
          onPressIn={() => {
            swipeGestureStarted.current = false;
          }}
          onPress={() => {
            if (!swipeGestureStarted.current) {
              onEdit(habit.id);
            }
          }}
          style={({ pressed }) => [
            styles.content,
            busy && styles.disabled,
            pressed && !busy && styles.pressed,
          ]}
        >
          <HabitIcon glyph={habit.glyph} />
          <View style={styles.meta}>
            <Text style={styles.name}>{habit.name}</Text>
            <Text style={styles.category}>{habit.category}</Text>
          </View>
        </Pressable>
        <View style={styles.reorder}>
          <View pointerEvents="none" style={styles.handleIcon}>
            <Ionicons
              accessible={false}
              importantForAccessibility="no-hide-descendants"
              name="reorder-three-outline"
              size={20}
              color={colors.muted}
            />
          </View>
        </View>
      </ReanimatedSwipeable>
      {!last ? <View pointerEvents="none" style={styles.separator} /> : null}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 80,
      width: "100%",
      backgroundColor: colors.surface,
      overflow: "hidden",
    },
    swipeable: {
      flex: 1,
      minHeight: 80,
      backgroundColor: colors.surface,
    },
    swipeableContent: {
      flex: 1,
      minHeight: 80,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
    },
    first: {
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
    },
    last: {
      borderBottomLeftRadius: radius.lg,
      borderBottomRightRadius: radius.lg,
    },
    content: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: space[3],
      minHeight: 80,
      paddingLeft: space[4],
      paddingRight: space[2],
      paddingVertical: space[3],
    },
    meta: { flex: 1, gap: 4 },
    name: {
      fontSize: 17,
      lineHeight: 23,
      fontWeight: "500",
      color: colors.ink,
    },
    category: {
      fontSize: 13,
      color: colors.muted,
      textTransform: "capitalize",
    },
    reorder: {
      width: 44,
      minHeight: 80,
      alignItems: "center",
      justifyContent: "center",
    },
    handleIcon: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.full,
    },
    removeAction: {
      width: 88,
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
    },
    removeActionContent: {
      width: 56,
      height: 56,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.full,
      backgroundColor: colors.danger,
    },
    separator: {
      position: "absolute",
      right: 0,
      bottom: 0,
      left: 0,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.line,
    },
    disabled: { opacity: 0.5 },
    pressed: { opacity: 0.84 },
  });
