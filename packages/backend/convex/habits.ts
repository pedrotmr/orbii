import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { STARTER_HABITS } from "./lib/habits";

export const list = query({
  args: { clientUserId: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("habits")
      .withIndex("by_clientUserId", (q) =>
        q.eq("clientUserId", args.clientUserId),
      )
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
    clientUserId: v.string(),
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
    const existing = await ctx.db
      .query("habits")
      .withIndex("by_clientUserId_habitKey", (q) =>
        q.eq("clientUserId", args.clientUserId).eq("habitKey", args.habitKey),
      )
      .unique();
    if (existing) {
      return existing._id;
    }
    return await ctx.db.insert("habits", {
      clientUserId: args.clientUserId,
      habitKey: args.habitKey,
      name: args.name,
      glyph: args.glyph,
      category: args.category,
    });
  },
});

export const remove = mutation({
  args: {
    clientUserId: v.string(),
    habitKey: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("habits")
      .withIndex("by_clientUserId_habitKey", (q) =>
        q.eq("clientUserId", args.clientUserId).eq("habitKey", args.habitKey),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const seedStarters = mutation({
  args: {
    clientUserId: v.string(),
    habitKeys: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    for (const key of args.habitKeys) {
      const starter = STARTER_HABITS.find((h) => h.id === key);
      if (!starter) {
        continue;
      }
      const existing = await ctx.db
        .query("habits")
        .withIndex("by_clientUserId_habitKey", (q) =>
          q.eq("clientUserId", args.clientUserId).eq("habitKey", starter.id),
        )
        .unique();
      if (existing) {
        continue;
      }
      await ctx.db.insert("habits", {
        clientUserId: args.clientUserId,
        habitKey: starter.id,
        name: starter.name,
        glyph: starter.glyph,
        category: starter.category,
      });
    }
  },
});
