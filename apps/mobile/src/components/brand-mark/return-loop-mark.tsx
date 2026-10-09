import { brandColors } from "@orbii/tokens";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "../../theme/use-theme";

interface ReturnLoopMarkProps {
  size: number;
}

export default function ReturnLoopMark({ size }: ReturnLoopMarkProps) {
  const { scheme } = useTheme();

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessible={false}>
      <Circle
        cx={32}
        cy={32}
        r={21}
        fill="none"
        stroke={scheme === "dark" ? brandColors.fog : brandColors.pine}
        strokeWidth={7}
        strokeDasharray="110 24"
        strokeLinecap="round"
        rotation={-34}
        origin="32,32"
      />
      <Circle cx={47} cy={16} r={4.5} fill={brandColors.coral} />
    </Svg>
  );
}
