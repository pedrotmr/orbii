import { NativeTabs } from "expo-router/native-tabs";
import { useTheme } from "../../theme/use-theme";

export default function AppTabs() {
  const { colors } = useTheme();
  return (
    <NativeTabs
      tintColor={colors.primary}
      indicatorColor={colors.primarySoft}
      backgroundColor={colors.bg}
      iconColor={{ default: colors.muted, selected: colors.primary }}
      labelStyle={{
        default: { color: colors.muted },
        selected: { color: colors.primary },
      }}
      disableTransparentOnScrollEdge
    >
      <NativeTabs.Trigger name="today" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="circle.dotted.circle.fill" md="today" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="orbit" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Label>Orbit</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="circle.grid.2x2" md="grid_view" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="slider.horizontal.3" md="tune" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
