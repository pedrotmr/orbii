import type { FunctionReturnType } from "convex/server";
import { api } from "@orbii/backend";

export type PointTransactionPage = FunctionReturnType<
  typeof api.points.listTransactions
>;

export type PointTransaction = PointTransactionPage["page"][number];
