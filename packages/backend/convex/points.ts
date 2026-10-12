import {
  paginationOptsValidator,
  paginationResultValidator,
} from "convex/server";
import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireClerkUserId } from "./lib/auth";

const pointTransactionValidator = v.object({
  id: v.id("pointTransactions"),
  amount: v.number(),
  sourceType: v.union(
    v.literal("habit_award"),
    v.literal("completion_bonus"),
    v.literal("reward_redemption"),
  ),
  sourceName: v.string(),
  localDate: v.string(),
});

export const listTransactions = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(pointTransactionValidator),
  handler: async (ctx, args) => {
    const clerkUserId = await requireClerkUserId(ctx);
    const transactions = await ctx.db
      .query("pointTransactions")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
      .order("desc")
      .paginate(args.paginationOpts);

    return {
      ...transactions,
      page: transactions.page.map((transaction) => ({
        id: transaction._id,
        amount: transaction.amount,
        sourceType: transaction.sourceType,
        sourceName: transaction.sourceName,
        localDate: transaction.localDate,
      })),
    };
  },
});
