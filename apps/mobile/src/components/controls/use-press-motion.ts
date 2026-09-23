import {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export const usePressMotion = () => {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const animate = (value: number) => {
    scale.value = withTiming(value, {
      duration: 120,
      easing: Easing.out(Easing.cubic),
      reduceMotion: ReduceMotion.System,
    });
  };
  return {
    style,
    onPressIn: () => animate(0.985),
    onPressOut: () => animate(1),
  };
};
