import { v } from "convex/values";
import type { Habit } from "./lib/habits";
import { mutation, query } from "./_generated/server";
import { requireClerkUserId } from "./lib/auth";
import {
  applyCompletionStats,
  applyMissedDayGap,
  commit as ritualCommit,
  emptyDay,
  rereveal as ritualRereveal,
  startReveal,
  toggleComplete as ritualToggleComplete,
  toggleSelect as ritualToggleSelect,
  type DaySession,
} from "./lib/ritual";

const requireUser = async (ctx: { db: any }, clerkUserId: string) => {
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkUserId", (q: any) => q.eq("clerkUserId", clerkUserId))
    .unique();

  if (!user) {
    throw new Error("User not found — call users.ensure first");
  }

  return user;
};

const listHabits = async (ctx: { db: any }, clerkUserId: string) => {
  const rows = await ctx.db
    .query("habits")
    .withIndex("by_clerkUserId", (q: any) => q.eq("clerkUserId", clerkUserId))
    .collect();
  return rows.map(
    (row: any) =>
      ({
        id: row.habitKey,
        name: row.name,
        glyph: row.glyph,
        category: row.category,
      }) satisfies Habit,
  );
};

const getSessionDoc = async (
  ctx: { db: any },
  clerkUserId: string,
  localDate: string,
) => {
  return await ctx.db
    .query("daySessions")
    .withIndex("by_clerkUserId_localDate", (q: any) =>
      q.eq("clerkUserId", clerkUserId).eq("localDate", localDate),
    )
    .unique();
};

const sessionFromDoc = (doc: {
  localDate: string;
  phase: DaySession["phase"];
  offeredIds: string[];
  selectedIds: string[];
  committedIds: string[];
  completedIds: string[];
}) => {
  return {
    localDate: doc.localDate,
    phase: doc.phase,
    offeredIds: doc.offeredIds,
    selectedIds: doc.selectedIds,
    committedIds: doc.committedIds,
    completedIds: doc.completedIds,
  } satisfies DaySession;
};

export const get = query({
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

    const stats = applyMissedDayGap(
      {
        streak: user.streak,
        daysCompleted: user.daysCompleted,
        lastCompletedLocalDate: user.lastCompletedLocalDate,
      },
      args.localDate,
    );
    const doc = await getSessionDoc(ctx, clerkUserId, args.localDate);
    return {
      capacity: user.capacity,
      streak: stats.streak,
      daysCompleted: user.daysCompleted,
      session: doc ? sessionFromDoc(doc) : emptyDay(args.localDate),
    };
  },
});

export const startRevealMutation = mutation({
  args: {
    localDate: v.string(),
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireClerkUserId(ctx);
    const user = await requireUser(ctx, clerkUserId);
    const habits = await listHabits(ctx, clerkUserId);
    const existing = await getSessionDoc(ctx, clerkUserId, args.localDate);

    if (existing?.phase === "complete") {
      throw new Error("Day already complete");
    }

    const stats = applyMissedDayGap(
      {
        streak: user.streak,
        daysCompleted: user.daysCompleted,
        lastCompletedLocalDate: user.lastCompletedLocalDate,
      },
      args.localDate,
    );

    if (stats.streak !== user.streak) {
      await ctx.db.patch(user._id, { streak: stats.streak });
    }

    const { session } = startReveal(
      habits,
      user.capacity,
      existing?.committedIds ?? [],
      args.localDate,
    );

    if (existing) {
      await ctx.db.patch(existing._id, session);
      return existing._id;
    }

    return await ctx.db.insert("daySessions", {
      clerkUserId,
      ...session,
    });
  },
});

export const toggleSelect = mutation({
  args: {
    localDate: v.string(),
    habitId: v.string(),
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireClerkUserId(ctx);
    const user = await requireUser(ctx, clerkUserId);
    const doc = await getSessionDoc(ctx, clerkUserId, args.localDate);

    if (!doc) {
      throw new Error("No day session");
    }

    const next = ritualToggleSelect(
      sessionFromDoc(doc),
      args.habitId,
      user.capacity,
    );
    await ctx.db.patch(doc._id, next);
  },
});

export const commit = mutation({
  args: {
    localDate: v.string(),
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireClerkUserId(ctx);
    const user = await requireUser(ctx, clerkUserId);
    const doc = await getSessionDoc(ctx, clerkUserId, args.localDate);

    if (!doc) {
      throw new Error("No day session");
    }

    const next = ritualCommit(sessionFromDoc(doc), user.capacity);
    await ctx.db.patch(doc._id, next);
  },
});

export const toggleComplete = mutation({
  args: {
    localDate: v.string(),
    habitId: v.string(),
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireClerkUserId(ctx);
    const user = await requireUser(ctx, clerkUserId);
    const doc = await getSessionDoc(ctx, clerkUserId, args.localDate);

    if (!doc) {
      throw new Error("No day session");
    }

    const before = sessionFromDoc(doc);
    const next = ritualToggleComplete(before, args.habitId);
    await ctx.db.patch(doc._id, next);

    if (before.phase !== "complete" && next.phase === "complete") {
      const stats = applyCompletionStats(
        {
          streak: user.streak,
          daysCompleted: user.daysCompleted,
          lastCompletedLocalDate: user.lastCompletedLocalDate,
        },
        args.localDate,
      );
      await ctx.db.patch(user._id, {
        streak: stats.streak,
        daysCompleted: stats.daysCompleted,
        lastCompletedLocalDate: stats.lastCompletedLocalDate,
      });
    }
  },
});

export const rereveal = mutation({
  args: {
    localDate: v.string(),
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireClerkUserId(ctx);
    const user = await requireUser(ctx, clerkUserId);
    const habits = await listHabits(ctx, clerkUserId);
    const doc = await getSessionDoc(ctx, clerkUserId, args.localDate);

    if (!doc) {
      throw new Error("No day session");
    }

    const next = ritualRereveal(habits, user.capacity, sessionFromDoc(doc));
    await ctx.db.patch(doc._id, next);
  },
});
