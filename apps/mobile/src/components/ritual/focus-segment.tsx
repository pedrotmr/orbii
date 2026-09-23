import { useEffect } from "react";
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Circle } from "react-native-svg";
import { useTheme } from "../../theme/use-theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface FocusSegmentProps {
  index: number;
  count: number;
  completed: boolean;
}

export default function FocusSegment({
  index,
  count,
  completed,
}: FocusSegmentProps) {
  const { colors } = useTheme();
  const progress = useSharedValue(completed ? 1 : 0);
  const circumference = 2 * Math.PI * 102;
  const gap = count === 1 ? 0 : 28;
  const length = circumference / count - gap;
  const transform = `rotate(${-90 + (index * 360) / count + (gap * 180) / circumference} 130 130)`;

  useEffect(() => {
    progress.value = withTiming(completed ? 1 : 0, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
      reduceMotion: ReduceMotion.System,
    });
    return () => cancelAnimation(progress);
  }, [completed, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDasharray: [
      length * progress.value,
      circumference - length * progress.value,
    ],
    opacity: progress.value,
  }));

  return (
    <>
      <Circle
        cx={130}
        cy={130}
        r={102}
        fill="none"
        stroke={colors.track}
        strokeWidth={18}
        strokeLinecap="round"
        strokeDasharray={[length, circumference - length]}
        transform={transform}
      />
      <AnimatedCircle
        cx={130}
        cy={130}
        r={102}
        fill="none"
        stroke={colors.focus}
        strokeWidth={18}
        strokeLinecap="round"
        transform={transform}
        animatedProps={animatedProps}
      />
    </>
  );
}
