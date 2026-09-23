import { type PropsWithChildren } from "react";
import { Pressable } from "react-native";

interface NativeButtonProps extends PropsWithChildren {
  disabled?: boolean;
  onPress: () => void;
}

// Expo UI buttons are native views; retain their interaction contract in Jest.
export default function NativeButton({
  children,
  disabled,
  onPress,
}: NativeButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
    >
      {children}
    </Pressable>
  );
}
