import {
  Children,
  cloneElement,
  isValidElement,
  type PropsWithChildren,
} from "react";
import { View } from "react-native";
import NativePickerItem, {
  type NativePickerItemProps,
} from "./native-picker-item";

interface NativePickerProps extends PropsWithChildren {
  enabled?: boolean;
  onValueChange: (value: unknown) => void;
  selectedValue: unknown;
}

function NativePicker({
  children,
  enabled = true,
  onValueChange,
  selectedValue,
}: NativePickerProps) {
  return (
    <View>
      {Children.map(children, (child) => {
        if (!isValidElement<NativePickerItemProps>(child)) {
          return child;
        }

        return cloneElement(child, {
          enabled,
          onValueChange,
          selected: child.props.value === selectedValue,
        });
      })}
    </View>
  );
}

export default Object.assign(NativePicker, { Item: NativePickerItem });
