import type { ReactNode } from "react";
import { type Palette, space } from "@orbii/tokens";
import { StatusBar } from "expo-status-bar";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-screens/experimental";
import { useThemedStyles } from "../../theme/use-theme";

interface ScreenScaffoldProps {
  children: ReactNode;
  tabbed?: boolean;
  scrollable?: boolean;
}

export default function ScreenScaffold({
  children,
  tabbed = false,
  scrollable = true,
}: ScreenScaffoldProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <SafeAreaView
      style={styles.safe}
      edges={{ top: true, bottom: true, left: true, right: true }}
      insetType={tabbed ? "all" : "system"}
    >
      <StatusBar style="auto" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
      >
        {scrollable ? (
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            contentInsetAdjustmentBehavior="never"
          >
            {children}
          </ScrollView>
        ) : (
          <View style={styles.flex}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const createStyles = (colors: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    flex: { flex: 1 },
    content: {
      flexGrow: 1,
      paddingHorizontal: space[6],
      paddingTop: space[4],
      paddingBottom: space[6],
      gap: space[6],
      width: "100%",
      maxWidth: 560,
      alignSelf: "center",
    },
  });
