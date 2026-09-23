import { Pressable, Text } from "react-native";

export interface NativePickerItemProps {
  enabled?: boolean;
  label: string;
  onValueChange?: (value: unknown) => void;
  selected?: boolean;
  value: unknown;
}

export default function NativePickerItem({
  enabled = true,
  label,
  onValueChange,
  selected,
  value,
}: NativePickerItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !enabled, selected }}
      disabled={!enabled}
      onPress={() => onValueChange?.(value)}
    >
      <Text>{label}</Text>
    </Pressable>
  );
}
