import "react-native-svg";

declare module "react-native-svg" {
  interface SvgProps {
    // Phosphor’s per-icon source exports pass this web attribute through to Svg.
    className?: string;
  }
}
