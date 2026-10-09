import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireClerkUserId } from "./lib/auth";
import {
  nextHabitOrder,
  sortHabitsByOrder,
  STARTER_HABITS,
} from "./lib/habits";
import { applyCompletionStats, scrubHabitFromSession } from "./lib/ritual";

const MAX_HABIT_NAME_LENGTH = 50;
const MAX_HABIT_GLYPH_LENGTH = 50;
const USERS_PER_ORDER_BACKFILL_BATCH = 20;

const habitCategoryValidator = v.union(
  v.literal("body"),
  v.literal("mind"),
  v.literal("learn"),
  v.literal("life"),
);

const validateHabitDetails = (nameInput: string, glyphInput: string) => {
  const name = nameInput.trim();
  const glyph = glyphInput.trim();

  if (name.length === 0 || name.length > MAX_HABIT_NAME_LENGTH) {
    throw new Error("Habit name must be between 1 and 50 characters");
  }

  if (glyph.length === 0 || glyph.length > MAX_HABIT_GLYPH_LENGTH) {
    throw new Error("Habit icon is invalid");
  }

  return { name, glyph };
};

export const list = query({
  args: {},
  handler: async (ctx) => {
    const clerkUserId = await requireClerkUserId(ctx);
    const rows = await ctx.db
      .query("habits")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
      .collect();
    return sortHabitsByOrder(rows).map((row) => ({
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
    category: habitCategoryValidator,
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireClerkUserId(ctx);
    const { name, glyph } = validateHabitDetails(args.name, args.glyph);
    const existing = await ctx.db
      .query("habits")
      .withIndex("by_clerkUserId_habitKey", (q) =>
        q.eq("clerkUserId", clerkUserId).eq("habitKey", args.habitKey),
      )
      .unique();

    if (existing) {
      return existing._id;
    }

    const habits = await ctx.db
      .query("habits")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
      .collect();

    return await ctx.db.insert("habits", {
      clerkUserId,
      habitKey: args.habitKey,
      name,
      glyph,
      category: args.category,
      order: nextHabitOrder(habits),
    });
  },
});

export const update = mutation({
  args: {
    habitKey: v.string(),
    name: v.string(),
    glyph: v.string(),
    category: habitCategoryValidator,
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireClerkUserId(ctx);
    const existing = await ctx.db
      .query("habits")
      .withIndex("by_clerkUserId_habitKey", (q) =>
        q.eq("clerkUserId", clerkUserId).eq("habitKey", args.habitKey),
      )
      .unique();

    if (!existing) {
      throw new Error("Habit not found");
    }

    const { name, glyph } = validateHabitDetails(args.name, args.glyph);

    await ctx.db.patch(existing._id, {
      name,
      glyph,
      category: args.category,
    });

    return existing._id;
  },
});

export const reorder = mutation({
  args: { habitKeys: v.array(v.string()) },
  handler: async (ctx, args) => {
    const clerkUserId = await requireClerkUserId(ctx);
    const habits = await ctx.db
      .query("habits")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
      .collect();
    const habitsByKey = new Map(habits.map((habit) => [habit.habitKey, habit]));

    if (
      args.habitKeys.length !== habits.length ||
      new Set(args.habitKeys).size !== args.habitKeys.length ||
      args.habitKeys.some((habitKey) => !habitsByKey.has(habitKey))
    ) {
      throw new Error("Habit order must include each Orbit habit exactly once");
    }

    for (const [order, habitKey] of args.habitKeys.entries()) {
      const habit = habitsByKey.get(habitKey);

      if (habit) {
        await ctx.db.patch(habit._id, { order });
      }
    }
  },
});

export const backfillOrder = internalMutation({
  args: { cursor: v.optional(v.union(v.string(), v.null())) },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .order("asc")
      .paginate({
        numItems: USERS_PER_ORDER_BACKFILL_BATCH,
        cursor: args.cursor ?? null,
      });
    let habitsUpdated = 0;

    for (const user of users.page) {
      const habits = await ctx.db
        .query("habits")
        .withIndex("by_clerkUserId", (q) =>
          q.eq("clerkUserId", user.clerkUserId),
        )
        .collect();

      if (!habits.some((habit) => habit.order === undefined)) {
        continue;
      }

      const oldestFirst = [...habits].sort(
        (left, right) => left._creationTime - right._creationTime,
      );

      for (const [order, habit] of oldestFirst.entries()) {
        await ctx.db.patch(habit._id, { order });
        habitsUpdated += 1;
      }
    }

    if (!users.isDone) {
      await ctx.scheduler.runAfter(0, internal.habits.backfillOrder, {
        cursor: users.continueCursor,
      });
    }

    return { habitsUpdated, isDone: users.isDone };
  },
});

export const remove = mutation({
  args: {
    habitKey: v.string(),
    localDate: v.optional(v.string()),
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

    if (!args.localDate) {
      return;
    }

    const sessionDoc = await ctx.db
      .query("daySessions")
      .withIndex("by_clerkUserId_localDate", (q) =>
        q.eq("clerkUserId", clerkUserId).eq("localDate", args.localDate!),
      )
      .unique();

    if (!sessionDoc) {
      return;
    }

    const wasComplete = sessionDoc.phase === "complete";
    const scrubbed = scrubHabitFromSession(
      {
        localDate: sessionDoc.localDate,
        phase: sessionDoc.phase,
        offeredIds: sessionDoc.offeredIds,
        selectedIds: sessionDoc.selectedIds,
        committedIds: sessionDoc.committedIds,
        completedIds: sessionDoc.completedIds,
      },
      args.habitKey,
    );

    await ctx.db.patch(sessionDoc._id, {
      phase: scrubbed.phase,
      offeredIds: scrubbed.offeredIds,
      selectedIds: scrubbed.selectedIds,
      committedIds: scrubbed.committedIds,
      completedIds: scrubbed.completedIds,
    });

    if (!wasComplete && scrubbed.phase === "complete") {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
        .unique();

      if (user) {
        const nextStats = applyCompletionStats(
          {
            streak: user.streak,
            daysCompleted: user.daysCompleted,
            lastCompletedLocalDate: user.lastCompletedLocalDate,
          },
          args.localDate,
        );
        await ctx.db.patch(user._id, nextStats);
      }
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

      const habits = await ctx.db
        .query("habits")
        .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
        .collect();

      await ctx.db.insert("habits", {
        clerkUserId,
        habitKey: starter.id,
        name: starter.name,
        glyph: starter.glyph,
        category: starter.category,
        order: nextHabitOrder(habits),
      });
    }
  },
});
