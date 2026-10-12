import { api } from "@orbii/backend";
import { useQuery } from "convex/react";
import { Redirect } from "expo-router";
import BootSpinner from "../../src/components/boot-spinner";
import RewardsScreen from "../../src/rewards/rewards-screen";

export default function RewardsRoute() {
  const user = useQuery(api.users.get, {});

  if (user === undefined) {
    return <BootSpinner label="Loading rewards" />;
  }

  if (user?.rewardsVisible === false) {
    return <Redirect href="/settings" />;
  }

  return <RewardsScreen />;
}
