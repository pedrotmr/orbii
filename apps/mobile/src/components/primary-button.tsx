import { Button, Host, Text, type ButtonVariant } from "@expo/ui";
import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { fontSize } from "@orbii/tokens";
import { StyleSheet, useWindowDimensions } from "react-native";
import { useTheme } from "../theme/use-theme";
import { selectionFeedback } from "./controls/feedback";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
}

export default function PrimaryButton({
  label,
  onPress,
  disabled = false,
  variant = "filled",
}: PrimaryButtonProps) {
  const { colors, scheme } = useTheme();
  const { fontScale } = useWindowDimensions();
  const labelSize =
    process.env.EXPO_OS === "ios" ? fontSize.md * fontScale : fontSize.md;
  const filledIOS = process.env.EXPO_OS === "ios" && variant === "filled";
  const tint = filledIOS ? colors.buttonFill : colors.primary;
  let labelColor = colors.primary;
  if (variant === "filled") {
    labelColor = filledIOS ? colors.onButton : colors.onPrimary;
  }
  return (
    <Host
      ignoreSafeArea="all"
      colorScheme={scheme}
      seedColor={tint}
      matchContents={{ vertical: true }}
      style={styles.host}
    >
      <Button
        variant={variant}
        disabled={disabled}
        onPress={() => {
          selectionFeedback();
          onPress();
        }}
      >
        <Text
          modifiers={
            process.env.EXPO_OS === "ios"
              ? [frame({ maxWidth: Infinity })]
              : [fillMaxWidth()]
          }
          textStyle={{
            fontSize: labelSize,
            color: disabled ? undefined : labelColor,
            fontWeight: "600",
            textAlign: "center",
          }}
          style={{ paddingVertical: 10, paddingHorizontal: 16 }}
        >
          {label}
        </Text>
      </Button>
    </Host>
  );
}

const styles = StyleSheet.create({ host: { width: "100%", minHeight: 52 } });
