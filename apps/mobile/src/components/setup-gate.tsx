import EnsureUserGate from "./ensure-user-gate";
import SetupWizardHost from "./setup-wizard-host";

export default function SetupGate() {
  return (
    <EnsureUserGate>
      <SetupWizardHost />
    </EnsureUserGate>
  );
}
