import type { FunctionReturnType } from "convex/server";
import { api } from "@orbii/backend";

export type ActiveReward = FunctionReturnType<
  typeof api.rewards.list
>["page"][number];

export interface RewardDraft {
  rewardId?: ActiveReward["id"];
  name: string;
  cost: string;
}
