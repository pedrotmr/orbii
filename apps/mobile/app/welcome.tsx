import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Redirect } from "expo-router";
import AuthWelcomeScreen from "../src/auth/auth-welcome-screen";
import BootSpinner from "../src/components/boot-spinner";

export default function WelcomeRoute() {
  return (
    <>
      <AuthLoading>
        <BootSpinner />
      </AuthLoading>
      <Authenticated>
        <Redirect href="/" />
      </Authenticated>
      <Unauthenticated>
        <AuthWelcomeScreen />
      </Unauthenticated>
    </>
  );
}
