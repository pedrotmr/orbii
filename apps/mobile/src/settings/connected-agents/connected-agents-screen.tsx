import { api } from "@orbii/backend";
import { useAction, useQuery } from "convex/react";
import { useState } from "react";
import BootSpinner from "../../components/boot-spinner";
import ConnectedAgentsContent from "./connected-agents-content";

export default function ConnectedAgentsScreen() {
  const agents = useQuery(api.remoteMcp.listConnections, {});
  const revokeConnection = useAction(api.remoteMcpActions.revokeConnection);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (agents === undefined) {
    return <BootSpinner label="Loading connected agents" />;
  }

  const handleRevoke = async (connectionId: (typeof agents)[number]["_id"]) => {
    if (busyId) {
      return;
    }

    try {
      setBusyId(connectionId);
      setError(null);
      const result = await revokeConnection({ connectionId });

      if (!result.providerRevoked) {
        setError(
          "Orbii has blocked this agent, but Clerk did not confirm token revocation. Retry after checking the backend OAuth secrets.",
        );
      }
    } catch (revokeError) {
      setError(
        revokeError instanceof Error
          ? revokeError.message
          : "We couldn’t revoke this connection. Try again.",
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ConnectedAgentsContent
      agents={agents}
      busyId={busyId}
      error={error}
      onRevoke={(connectionId) => void handleRevoke(connectionId)}
    />
  );
}
