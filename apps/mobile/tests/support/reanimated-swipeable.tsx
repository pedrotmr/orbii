import { createElement, type ComponentProps, type ReactNode } from "react";
import { View } from "react-native";

interface MockReanimatedSwipeableProps {
  children: ReactNode;
  renderRightActions?: () => ReactNode;
  onSwipeableOpenStartDrag?: () => void;
  onSwipeableCloseStartDrag?: () => void;
  onSwipeableOpen?: () => void;
  onSwipeableClose?: () => void;
}

export default function MockReanimatedSwipeable({
  children,
  renderRightActions,
  onSwipeableOpenStartDrag,
  onSwipeableCloseStartDrag,
  onSwipeableOpen,
  onSwipeableClose,
}: MockReanimatedSwipeableProps) {
  const props = {
    testID: "reanimated-swipeable",
    onSwipeableOpenStartDrag,
    onSwipeableCloseStartDrag,
    onSwipeableOpen,
    onSwipeableClose,
  } as unknown as ComponentProps<typeof View>;

  return createElement(View, props, children, renderRightActions?.());
}
