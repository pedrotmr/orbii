import { jest } from "@jest/globals";
import { useImperativeHandle, type Ref } from "react";
import { View, type ViewProps } from "react-native";

export const playAnimation = jest.fn();

interface LottieViewProps extends ViewProps {
  ref?: Ref<{ play: () => void }>;
}

export default function LottieViewMock({ ref, ...props }: LottieViewProps) {
  useImperativeHandle(ref, () => ({ play: playAnimation }), []);
  return <View {...props} />;
}
