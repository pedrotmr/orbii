import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireClerkUserId } from "./lib/auth";
import { DEFAULT_CAPACITY, MAX_CAPACITY, MIN_CAPACITY } from "./lib/habits";
import { applyMissedDayGap } from "./lib/ritual";
import { normalizeTimezone } from "./lib/timezone";

export const ensure = mutation({
  args: {
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireClerkUserId(ctx);
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
      .unique();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkUserId,
      capacity: DEFAULT_CAPACITY,
      timezone: normalizeTimezone(args.timezone ?? "UTC"),
      streak: 0,
      daysCompleted: 0,
      lastCompletedLocalDate: null,
    });
  },
});

export const get = query({
  args: {},
  handler: async (ctx) => {
    const clerkUserId = await requireClerkUserId(ctx);
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
      .unique();

    if (!user) {
      return null;
    }

    return user;
  },
});

export const setCapacity = mutation({
  args: {
    capacity: v.number(),
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireClerkUserId(ctx);
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
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

export const setTimezone = mutation({
  args: {
    timezone: v.string(),
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireClerkUserId(ctx);
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      timezone: normalizeTimezone(args.timezone),
    });
  },
});

export const stats = query({
  args: {
    localDate: v.string(),
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireClerkUserId(ctx);
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
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
