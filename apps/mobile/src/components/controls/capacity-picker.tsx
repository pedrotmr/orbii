import { Host, Picker } from "@expo/ui";
import { MAX_CAPACITY, MIN_CAPACITY } from "@orbii/backend";
import { StyleSheet } from "react-native";
import { useTheme } from "../../theme/use-theme";
import { selectionFeedback } from "./feedback";

interface CapacityPickerProps {
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

const options = Array.from(
  { length: MAX_CAPACITY - MIN_CAPACITY + 1 },
  (_, i) => MIN_CAPACITY + i,
);

export default function CapacityPicker({
  value,
  disabled,
  onChange,
}: CapacityPickerProps) {
  const { colors, scheme } = useTheme();
  return (
    <Host
      ignoreSafeArea="all"
      colorScheme={scheme}
      seedColor={colors.primary}
      matchContents={{ vertical: true }}
      style={styles.host}
    >
      <Picker
        selectedValue={value}
        enabled={!disabled}
        onValueChange={(next) => {
          selectionFeedback();
          onChange(next);
        }}
      >
        {options.map((option) => (
          <Picker.Item
            key={option}
            label={`${option} ${option === 1 ? "habit" : "habits"}`}
            value={option}
          />
        ))}
      </Picker>
    </Host>
  );
}

const styles = StyleSheet.create({ host: { minHeight: 48, minWidth: 120 } });
