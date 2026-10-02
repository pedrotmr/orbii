import { Image } from "react-native";

interface GoogleLogoProps {
  size: number;
}

export default function GoogleLogo({ size }: GoogleLogoProps) {
  return (
    <Image
      source={require("../../../../../assets/sign-in/google-g.png")}
      style={{ width: size, height: size }}
    />
  );
}
