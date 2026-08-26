import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Redirect } from "expo-router";
import AuthenticatedTabs from "../../src/components/authenticated-tabs";
import BootSpinner from "../../src/components/boot-spinner";

export default function TabsLayout() {
  return (
    <>
      <AuthLoading>
        <BootSpinner />
      </AuthLoading>
      <Unauthenticated>
        <Redirect href="/welcome" />
      </Unauthenticated>
      <Authenticated>
        <AuthenticatedTabs />
      </Authenticated>
    </>
  );
}
