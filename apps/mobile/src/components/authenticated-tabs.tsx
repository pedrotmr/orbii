import EnsureUserGate from "./ensure-user-gate";
import TabsWithOrbitGate from "./tabs-with-orbit-gate";

export default function AuthenticatedTabs() {
  return (
    <EnsureUserGate>
      <TabsWithOrbitGate />
    </EnsureUserGate>
  );
}
