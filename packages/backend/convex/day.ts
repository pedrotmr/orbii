import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
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
  type Habit,
} from "./lib/ritual";

async function requireUser(ctx: { db: any }, clientUserId: string) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_clientUserId", (q: any) =>
      q.eq("clientUserId", clientUserId),
    )
    .unique();
  if (!user) throw new Error("User not found — call users.ensure first");
  return user;
}

async function listHabits(
  ctx: { db: any },
  clientUserId: string,
): Promise<Habit[]> {
  const rows = await ctx.db
    .query("habits")
    .withIndex("by_clientUserId", (q: any) =>
      q.eq("clientUserId", clientUserId),
    )
    .collect();
  return rows.map((row: any) => ({
    id: row.habitKey,
    name: row.name,
    glyph: row.glyph,
    category: row.category,
  }));
}

async function getSessionDoc(
  ctx: { db: any },
  clientUserId: string,
  localDate: string,
) {
  return await ctx.db
    .query("daySessions")
    .withIndex("by_clientUserId_localDate", (q: any) =>
      q.eq("clientUserId", clientUserId).eq("localDate", localDate),
    )
    .unique();
}

function sessionFromDoc(doc: {
  localDate: string;
  phase: DaySession["phase"];
  offeredIds: string[];
  selectedIds: string[];
  committedIds: string[];
  completedIds: string[];
}): DaySession {
  return {
    localDate: doc.localDate,
    phase: doc.phase,
    offeredIds: doc.offeredIds,
    selectedIds: doc.selectedIds,
    committedIds: doc.committedIds,
    completedIds: doc.completedIds,
  };
}

export const get = query({
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
    if (!user) return null;
    const stats = applyMissedDayGap(
      {
        streak: user.streak,
        daysCompleted: user.daysCompleted,
        lastCompletedLocalDate: user.lastCompletedLocalDate,
      },
      args.localDate,
    );
    const doc = await getSessionDoc(ctx, args.clientUserId, args.localDate);
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
    clientUserId: v.string(),
    localDate: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.clientUserId);
    const habits = await listHabits(ctx, args.clientUserId);
    const existing = await getSessionDoc(
      ctx,
      args.clientUserId,
      args.localDate,
    );
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
      clientUserId: args.clientUserId,
      ...session,
    });
  },
});

export const toggleSelect = mutation({
  args: {
    clientUserId: v.string(),
    localDate: v.string(),
    habitId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.clientUserId);
    const doc = await getSessionDoc(ctx, args.clientUserId, args.localDate);
    if (!doc) throw new Error("No day session");
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
    clientUserId: v.string(),
    localDate: v.string(),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.clientUserId);
    const doc = await getSessionDoc(ctx, args.clientUserId, args.localDate);
    if (!doc) throw new Error("No day session");
    const next = ritualCommit(sessionFromDoc(doc));
    await ctx.db.patch(doc._id, next);
  },
});

export const toggleComplete = mutation({
  args: {
    clientUserId: v.string(),
    localDate: v.string(),
    habitId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.clientUserId);
    const doc = await getSessionDoc(ctx, args.clientUserId, args.localDate);
    if (!doc) throw new Error("No day session");
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
    clientUserId: v.string(),
    localDate: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.clientUserId);
    const habits = await listHabits(ctx, args.clientUserId);
    const doc = await getSessionDoc(ctx, args.clientUserId, args.localDate);
    if (!doc) throw new Error("No day session");
    const next = ritualRereveal(habits, user.capacity, sessionFromDoc(doc));
    await ctx.db.patch(doc._id, next);
  },
});
