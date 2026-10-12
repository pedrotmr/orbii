import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { requireClerkUserId } from "./lib/auth";
import { insertPointTransaction } from "./lib/points";
import { localDateInTimezone } from "./lib/timezone";

const normalizeRewardDraft = (name: string, cost: number) => {
  const normalizedName = name.trim();

  if (normalizedName.length === 0) {
    throw new Error("Reward name is required");
  }

  if (!Number.isInteger(cost) || cost <= 0) {
    throw new Error("Reward cost must be a positive whole number");
  }

  return { name: normalizedName, cost };
};

const getOwnedActiveReward = async (
  ctx: MutationCtx,
  clerkUserId: string,
  rewardId: Id<"rewards">,
) => {
  const reward = await ctx.db.get(rewardId);

  if (!reward || reward.clerkUserId !== clerkUserId) {
    throw new Error("Reward not found");
  }

  if (reward.status !== "active") {
    throw new Error("Reward is not active");
  }

  return reward;
};

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireClerkUserId(ctx);
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
      .unique();
    const pointsBalance = user?.pointsBalance ?? 0;
    const rewards = await ctx.db
      .query("rewards")
      .withIndex("by_clerkUserId_and_status", (q) =>
        q.eq("clerkUserId", clerkUserId).eq("status", "active"),
      )
      .order("desc")
      .paginate(args.paginationOpts);

    return {
      ...rewards,
      pointsBalance,
      page: rewards.page.map((reward) => ({
        id: reward._id,
        name: reward.name,
        cost: reward.cost,
        pointsProgress: Math.min(pointsBalance, reward.cost),
        pointsRemaining: Math.max(0, reward.cost - pointsBalance),
        isEligible: pointsBalance >= reward.cost,
      })),
    };
  },
});

export const listRedeemed = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireClerkUserId(ctx);
    const rewards = await ctx.db
      .query("rewards")
      .withIndex("by_clerkUserId_status_redeemedAt", (q) =>
        q.eq("clerkUserId", clerkUserId).eq("status", "redeemed"),
      )
      .order("desc")
      .paginate(args.paginationOpts);

    return {
      ...rewards,
      page: rewards.page.map((reward) => ({
        id: reward._id,
        name: reward.name,
        cost: reward.cost,
        redeemedAt: reward.redeemedAt ?? null,
        redeemedLocalDate: reward.redeemedLocalDate ?? null,
      })),
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    cost: v.number(),
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireClerkUserId(ctx);
    const draft = normalizeRewardDraft(args.name, args.cost);

    return await ctx.db.insert("rewards", {
      clerkUserId,
      ...draft,
      status: "active",
    });
  },
});

export const update = mutation({
  args: {
    rewardId: v.id("rewards"),
    name: v.string(),
    cost: v.number(),
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireClerkUserId(ctx);
    await getOwnedActiveReward(ctx, clerkUserId, args.rewardId);
    const draft = normalizeRewardDraft(args.name, args.cost);

    await ctx.db.patch(args.rewardId, draft);
  },
});

export const deleteReward = mutation({
  args: {
    rewardId: v.id("rewards"),
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireClerkUserId(ctx);
    await getOwnedActiveReward(ctx, clerkUserId, args.rewardId);
    await ctx.db.delete(args.rewardId);
  },
});

export const redeem = mutation({
  args: {
    rewardId: v.id("rewards"),
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireClerkUserId(ctx);
    const reward = await getOwnedActiveReward(ctx, clerkUserId, args.rewardId);
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    if ((user.pointsBalance ?? 0) < reward.cost) {
      throw new Error("Not enough points to redeem this reward");
    }

    const redeemedAt = Date.now();
    const redeemedLocalDate = localDateInTimezone(user.timezone, redeemedAt);
    const inserted = await insertPointTransaction(ctx, clerkUserId, user._id, {
      amount: -reward.cost,
      sourceType: "reward_redemption",
      sourceName: reward.name,
      localDate: redeemedLocalDate,
      idempotencyKey: `redemption:${reward._id}`,
    });

    if (!inserted) {
      throw new Error("Reward redemption already recorded");
    }

    await ctx.db.patch(reward._id, {
      status: "redeemed",
      redeemedAt,
      redeemedLocalDate,
    });
  },
});
