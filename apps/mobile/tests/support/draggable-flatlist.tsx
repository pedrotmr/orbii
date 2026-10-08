import type { Habit } from "@orbii/backend";
import { createElement, Fragment, type ReactNode } from "react";
import { View } from "react-native";

interface MockDraggableFlatListProps {
  data: Habit[];
  renderItem: (params: {
    item: Habit;
    index: number;
    drag: () => void;
    isActive: boolean;
  }) => ReactNode;
  ItemSeparatorComponent?: () => ReactNode;
}

export default function MockDraggableFlatList({
  data,
  renderItem,
  ItemSeparatorComponent,
}: MockDraggableFlatListProps) {
  const children = data.flatMap((item, index) => {
    const separator =
      index > 0 && ItemSeparatorComponent ? (
        <ItemSeparatorComponent key={`separator-${item.id}`} />
      ) : null;

    return [
      separator,
      createElement(
        Fragment,
        { key: item.id },
        renderItem({ item, index, drag: () => {}, isActive: false }),
      ),
    ];
  });

  return createElement(View, null, children);
}
