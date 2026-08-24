import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { OrbitProvider } from "@/state/orbitStore";
import { AppShell } from "@/AppShell";
import { WelcomeScreen } from "@/screens/WelcomeScreen";
import { SetupScreen } from "@/screens/SetupScreen";
import { TodayScreen } from "@/screens/TodayScreen";
import { OrbitScreen } from "@/screens/OrbitScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";
import { DesignSystemPage } from "@/screens/DesignSystemPage";
import "@/components/ui.css";
import "@/styles/global.css";

export default function App() {
  return (
    <OrbitProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/design-system" element={<DesignSystemPage />} />
          <Route element={<AppShell />}>
            <Route index element={<WelcomeScreen />} />
            <Route path="orbit/setup" element={<SetupScreen />} />
            <Route path="today" element={<TodayScreen />} />
            <Route path="orbit" element={<OrbitScreen />} />
            <Route path="settings" element={<SettingsScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </OrbitProvider>
  );
}
