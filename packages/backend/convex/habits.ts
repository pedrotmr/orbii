import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireClerkUserId } from "./lib/auth";
import { STARTER_HABITS } from "./lib/habits";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const clerkUserId = await requireClerkUserId(ctx);
    const rows = await ctx.db
      .query("habits")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
      .collect();
    return rows.map((row) => ({
      id: row.habitKey,
      name: row.name,
      glyph: row.glyph,
      category: row.category,
    }));
  },
});

export const add = mutation({
  args: {
    habitKey: v.string(),
    name: v.string(),
    glyph: v.string(),
    category: v.union(
      v.literal("body"),
      v.literal("mind"),
      v.literal("learn"),
      v.literal("life"),
    ),
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireClerkUserId(ctx);
    const existing = await ctx.db
      .query("habits")
      .withIndex("by_clerkUserId_habitKey", (q) =>
        q.eq("clerkUserId", clerkUserId).eq("habitKey", args.habitKey),
      )
      .unique();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("habits", {
      clerkUserId,
      habitKey: args.habitKey,
      name: args.name,
      glyph: args.glyph,
      category: args.category,
    });
  },
});

export const remove = mutation({
  args: {
    habitKey: v.string(),
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireClerkUserId(ctx);
    const existing = await ctx.db
      .query("habits")
      .withIndex("by_clerkUserId_habitKey", (q) =>
        q.eq("clerkUserId", clerkUserId).eq("habitKey", args.habitKey),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const seedStarters = mutation({
  args: {
    habitKeys: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireClerkUserId(ctx);

    for (const key of args.habitKeys) {
      const starter = STARTER_HABITS.find((h) => h.id === key);

      if (!starter) {
        continue;
      }

      const existing = await ctx.db
        .query("habits")
        .withIndex("by_clerkUserId_habitKey", (q) =>
          q.eq("clerkUserId", clerkUserId).eq("habitKey", starter.id),
        )
        .unique();

      if (existing) {
        continue;
      }

      await ctx.db.insert("habits", {
        clerkUserId,
        habitKey: starter.id,
        name: starter.name,
        glyph: starter.glyph,
        category: starter.category,
      });
    }
  },
});
