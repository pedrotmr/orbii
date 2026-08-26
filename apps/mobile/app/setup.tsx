import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Redirect } from "expo-router";
import BootSpinner from "../src/components/boot-spinner";
import SetupGate from "../src/components/setup-gate";

export default function SetupRoute() {
  return (
    <>
      <AuthLoading>
        <BootSpinner />
      </AuthLoading>
      <Unauthenticated>
        <Redirect href="/welcome" />
      </Unauthenticated>
      <Authenticated>
        <SetupGate />
      </Authenticated>
    </>
  );
}
