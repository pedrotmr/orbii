import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Redirect } from "expo-router";
import BootSpinner from "../src/components/boot-spinner";
import PointsHistoryScreen from "../src/points-history/points-history-screen";

export default function PointsHistoryRoute() {
  return (
    <>
      <AuthLoading>
        <BootSpinner />
      </AuthLoading>
      <Unauthenticated>
        <Redirect href="/welcome" />
      </Unauthenticated>
      <Authenticated>
        <PointsHistoryScreen />
      </Authenticated>
    </>
  );
}
