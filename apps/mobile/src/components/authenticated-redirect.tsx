import EnsureUserGate from "./ensure-user-gate";
import HabitRedirect from "./habit-redirect";

export default function AuthenticatedRedirect() {
  return (
    <EnsureUserGate>
      <HabitRedirect />
    </EnsureUserGate>
  );
}
