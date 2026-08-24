import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { DEFAULT_CAPACITY, MAX_CAPACITY, MIN_CAPACITY } from "./lib/habits";
import { applyMissedDayGap } from "./lib/ritual";

export const ensure = mutation({
  args: {
    clientUserId: v.string(),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clientUserId", (q) =>
        q.eq("clientUserId", args.clientUserId),
      )
      .unique();
    if (existing) {
      return existing._id;
    }
    return await ctx.db.insert("users", {
      clientUserId: args.clientUserId,
      capacity: DEFAULT_CAPACITY,
      timezone: args.timezone ?? "UTC",
      streak: 0,
      daysCompleted: 0,
      lastCompletedLocalDate: null,
    });
  },
});

export const get = query({
  args: { clientUserId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clientUserId", (q) =>
        q.eq("clientUserId", args.clientUserId),
      )
      .unique();
    if (!user) {
      return null;
    }
    return user;
  },
});

export const setCapacity = mutation({
  args: {
    clientUserId: v.string(),
    capacity: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clientUserId", (q) =>
        q.eq("clientUserId", args.clientUserId),
      )
      .unique();
    if (!user) {
      throw new Error("User not found");
    }
    const capacity = Math.max(
      MIN_CAPACITY,
      Math.min(MAX_CAPACITY, Math.floor(args.capacity)),
    );
    await ctx.db.patch(user._id, { capacity });
  },
});

export const stats = query({
  args: {
    clientUserId: v.string(),
    localDate: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clientUserId", (q) =>
        q.eq("clientUserId", args.clientUserId),
      )
      .unique();
    if (!user) {
      return null;
    }
    const adjusted = applyMissedDayGap(
      {
        streak: user.streak,
        daysCompleted: user.daysCompleted,
        lastCompletedLocalDate: user.lastCompletedLocalDate,
      },
      args.localDate,
    );
    return {
      capacity: user.capacity,
      streak: adjusted.streak,
      daysCompleted: user.daysCompleted,
      lastCompletedLocalDate: user.lastCompletedLocalDate,
      timezone: user.timezone,
    };
  },
});
