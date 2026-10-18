import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Redirect } from "expo-router";
import BootSpinner from "../../src/components/boot-spinner";
import ConnectedAgentsScreen from "../../src/settings/connected-agents/connected-agents-screen";

export default function ConnectedAgentsRoute() {
  return (
    <>
      <AuthLoading>
        <BootSpinner />
      </AuthLoading>
      <Unauthenticated>
        <Redirect href="/welcome" />
      </Unauthenticated>
      <Authenticated>
        <ConnectedAgentsScreen />
      </Authenticated>
    </>
  );
}
