import type { Habit } from "@orbii/backend";
import { createElement, Fragment, type ReactNode } from "react";
import { View } from "react-native";

interface MockSortableGridProps {
  data: Habit[];
  renderItem: (params: {
    item: Habit;
    index: number;
    drag: () => void;
    isActive: boolean;
  }) => ReactNode;
}

export default function MockSortableGrid({
  data,
  renderItem,
}: MockSortableGridProps) {
  return createElement(
    View,
    null,
    data.map((item, index) =>
      createElement(
        Fragment,
        { key: item.id },
        renderItem({ item, index, drag: () => {}, isActive: false }),
      ),
    ),
  );
}
