import type { Habit } from "@orbii/backend";
import {
  createElement,
  Fragment,
  type ComponentProps,
  type ReactNode,
} from "react";
import { View } from "react-native";

interface MockSortableGridProps {
  data: Habit[];
  renderItem: (params: {
    item: Habit;
    index: number;
    drag: () => void;
    isActive: boolean;
  }) => ReactNode;
  onDragEnd?: (event: {
    data: Habit[];
    fromIndex: number;
    toIndex: number;
  }) => void;
}

export default function MockSortableGrid({
  data,
  renderItem,
  onDragEnd,
}: MockSortableGridProps) {
  const props = {
    testID: "sortable-grid",
    onDragEnd,
  } as unknown as ComponentProps<typeof View>;

  return createElement(
    View,
    props,
    data.map((item, index) =>
      createElement(
        Fragment,
        { key: item.id },
        renderItem({ item, index, drag: () => {}, isActive: false }),
      ),
    ),
  );
}
