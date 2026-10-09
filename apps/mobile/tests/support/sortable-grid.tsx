import type { Habit } from "@orbii/backend";
import {
  createElement,
  Fragment,
  type ComponentProps,
  type ReactNode,
  useEffect,
  useState,
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
  const [displayedData, setDisplayedData] = useState(data);

  useEffect(() => {
    setDisplayedData(data);
  }, [data]);

  const props = {
    testID: "sortable-grid",
    onDragEnd: (event: {
      data: Habit[];
      fromIndex: number;
      toIndex: number;
    }) => {
      setDisplayedData(event.data);
      onDragEnd?.(event);
    },
  } as unknown as ComponentProps<typeof View>;

  return createElement(
    View,
    props,
    displayedData.map((item, index) =>
      createElement(
        Fragment,
        { key: item.id },
        renderItem({ item, index, drag: () => {}, isActive: false }),
      ),
    ),
  );
}
