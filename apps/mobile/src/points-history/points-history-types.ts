import type { FunctionReturnType } from "convex/server";
import { api } from "@orbii/backend";

export type PointTransaction = FunctionReturnType<
  typeof api.points.listTransactions
>["page"][number];
