import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Redirect } from "expo-router";
import AuthenticatedRedirect from "../src/components/authenticated-redirect";
import BootSpinner from "../src/components/boot-spinner";

export default function Index() {
  return (
    <>
      <AuthLoading>
        <BootSpinner />
      </AuthLoading>
      <Unauthenticated>
        <Redirect href="/welcome" />
      </Unauthenticated>
      <Authenticated>
        <AuthenticatedRedirect />
      </Authenticated>
    </>
  );
}
