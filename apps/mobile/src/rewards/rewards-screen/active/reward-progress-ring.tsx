import Svg, { Circle, Path } from "react-native-svg";
import { useTheme } from "../../../theme/use-theme";

interface RewardProgressRingProps {
  progress: number;
  ready: boolean;
}

const SIZE = 40;
const CENTER = SIZE / 2;
const RADIUS = 17;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function RewardProgressRing({
  progress,
  ready,
}: RewardProgressRingProps) {
  const { colors } = useTheme();
  const stroke = ready ? colors.success : colors.primary;

  return (
    <Svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      accessible={false}
    >
      <Circle
        cx={CENTER}
        cy={CENTER}
        r={RADIUS}
        stroke={colors.track}
        strokeWidth={3}
        fill="none"
      />
      <Circle
        cx={CENTER}
        cy={CENTER}
        r={RADIUS}
        rotation="-90"
        origin={`${CENTER},${CENTER}`}
        stroke={stroke}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={`${CIRCUMFERENCE}, ${CIRCUMFERENCE}`}
        strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
        fill="none"
      />
      {ready ? (
        <Path
          d="m14 20 4 4 8-9"
          fill="none"
          stroke={colors.success}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </Svg>
  );
}
