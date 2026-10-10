import { v } from "convex/values";
import type { Habit } from "./lib/habits";
import { mutation, query } from "./_generated/server";
import { requireClerkUserId } from "./lib/auth";
import {
  getHabitPointValue,
  habitAwardIdempotencyKey,
  insertCompletionBonus,
  insertSessionPointAward,
} from "./lib/points";
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
import { requireSavedTimezoneToday } from "./lib/timezone";

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
  const habits: Habit[] = rows.map((row: any) => ({
    id: row.habitKey,
    name: row.name,
    glyph: row.glyph,
    category: row.category,
    pointValue: getHabitPointValue(row.pointValue, row.habitKey),
  }));

  return habits;
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
  committedPointValues?: { habitId: string; points: number }[];
}) => {
  return {
    localDate: doc.localDate,
    phase: doc.phase,
    offeredIds: doc.offeredIds,
    selectedIds: doc.selectedIds,
    committedIds: doc.committedIds,
    completedIds: doc.completedIds,
    committedPointValues:
      doc.committedPointValues ??
      doc.committedIds.map((habitId) => ({
        habitId,
        points: getHabitPointValue(undefined, habitId),
      })),
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
    const earnedPoints = doc?.earnedPoints ?? 0;

    return {
      capacity: user.capacity,
      streak: stats.streak,
      daysCompleted: user.daysCompleted,
      earnedPoints,
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
    const sessionLocalDate = requireSavedTimezoneToday(
      args.localDate,
      user.timezone,
    );

    const habits = await listHabits(ctx, clerkUserId);
    const existing = await getSessionDoc(ctx, clerkUserId, sessionLocalDate);

    if (existing?.phase === "complete") {
      throw new Error("Day already complete");
    }

    const stats = applyMissedDayGap(
      {
        streak: user.streak,
        daysCompleted: user.daysCompleted,
        lastCompletedLocalDate: user.lastCompletedLocalDate,
      },
      sessionLocalDate,
    );

    if (stats.streak !== user.streak) {
      await ctx.db.patch(user._id, { streak: stats.streak });
    }

    const { session } = startReveal(
      habits,
      existing?.committedIds ?? [],
      sessionLocalDate,
    );

    if (existing) {
      await ctx.db.patch(existing._id, session);
      return existing._id;
    }

    return await ctx.db.insert("daySessions", {
      clerkUserId,
      ...session,
      earnedPoints: 0,
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
    const sessionLocalDate = requireSavedTimezoneToday(
      args.localDate,
      user.timezone,
    );
    const doc = await getSessionDoc(ctx, clerkUserId, sessionLocalDate);

    if (!doc) {
      throw new Error("No day session");
    }

    const next = ritualToggleSelect(sessionFromDoc(doc), args.habitId);
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
    const sessionLocalDate = requireSavedTimezoneToday(
      args.localDate,
      user.timezone,
    );
    const doc = await getSessionDoc(ctx, clerkUserId, sessionLocalDate);

    if (!doc) {
      throw new Error("No day session");
    }

    const next = ritualCommit(sessionFromDoc(doc));
    const habits = await listHabits(ctx, clerkUserId);
    const habitsById = new Map(habits.map((habit) => [habit.id, habit]));
    const committedPointValues = next.committedIds.map((habitId) => {
      const habit = habitsById.get(habitId);

      if (!habit) {
        throw new Error("A selected habit is no longer in your Orbit");
      }

      return {
        habitId,
        points: getHabitPointValue(habit.pointValue, habitId),
      };
    });

    await ctx.db.patch(doc._id, { ...next, committedPointValues });
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
    const sessionLocalDate = requireSavedTimezoneToday(
      args.localDate,
      user.timezone,
    );
    const doc = await getSessionDoc(ctx, clerkUserId, sessionLocalDate);

    if (!doc) {
      throw new Error("No day session");
    }

    const before = sessionFromDoc(doc);
    const next = ritualToggleComplete(before, args.habitId);
    const isFirstCheckoff = !before.completedIds.includes(args.habitId);
    const completedOrbit =
      before.phase !== "complete" && next.phase === "complete";
    if (isFirstCheckoff) {
      const habit = await ctx.db
        .query("habits")
        .withIndex("by_clerkUserId_habitKey", (q) =>
          q.eq("clerkUserId", clerkUserId).eq("habitKey", args.habitId),
        )
        .unique();

      if (!habit) {
        throw new Error("Habit not found");
      }

      const pointValue =
        before.committedPointValues.find(
          (snapshot) => snapshot.habitId === args.habitId,
        )?.points ?? getHabitPointValue(undefined, args.habitId);

      await insertSessionPointAward(ctx, clerkUserId, user._id, doc._id, {
        amount: pointValue,
        sourceType: "habit_award",
        sourceName: habit.name,
        localDate: sessionLocalDate,
        idempotencyKey: habitAwardIdempotencyKey(
          sessionLocalDate,
          args.habitId,
        ),
      });
    }

    await ctx.db.patch(doc._id, next);

    if (completedOrbit) {
      await insertCompletionBonus(
        ctx,
        clerkUserId,
        user._id,
        doc._id,
        sessionLocalDate,
      );

      const stats = applyCompletionStats(
        {
          streak: user.streak,
          daysCompleted: user.daysCompleted,
          lastCompletedLocalDate: user.lastCompletedLocalDate,
        },
        sessionLocalDate,
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
    const sessionLocalDate = requireSavedTimezoneToday(
      args.localDate,
      user.timezone,
    );
    const habits = await listHabits(ctx, clerkUserId);
    const doc = await getSessionDoc(ctx, clerkUserId, sessionLocalDate);

    if (!doc) {
      throw new Error("No day session");
    }

    const next = ritualRereveal(habits, sessionFromDoc(doc));
    await ctx.db.patch(doc._id, next);
  },
});
