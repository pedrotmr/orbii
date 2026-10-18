import { v } from "convex/values";
import type { Habit } from "./lib/habits";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";
import { requireClerkUserId } from "./lib/auth";
import {
  completionBonusReversalIdempotencyKey,
  getCompletionBonus,
  getHabitAward,
  getHabitPointValue,
  getSessionEarnedPoints,
  habitAwardIdempotencyKey,
  habitAwardReversalIdempotencyKey,
  insertCompletionBonus,
  insertSessionPointAward,
  insertSessionPointTransaction,
} from "./lib/points";
import {
  applyCompletionStats,
  applyMissedDayGap,
  commit as ritualCommit,
  emptyDay,
  rereveal as ritualRereveal,
  revertCompletionStats,
  startReveal,
  toggleComplete as ritualToggleComplete,
  toggleSelect as ritualToggleSelect,
  type DaySession,
} from "./lib/ritual";
import { localDateInTimezone, requireSavedTimezoneToday } from "./lib/timezone";

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
  committedHabitSnapshots?: { habitId: string; name: string; glyph: string }[];
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
    committedHabitSnapshots: doc.committedHabitSnapshots ?? [],
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
    const earnedPoints = doc ? await getSessionEarnedPoints(ctx, doc) : 0;

    return {
      capacity: user.capacity,
      streak: stats.streak,
      daysCompleted: user.daysCompleted,
      earnedPoints,
      session: doc ? sessionFromDoc(doc) : emptyDay(args.localDate),
    };
  },
});

export const getForRemoteMcp = internalQuery({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.clerkUserId);
    const localDate = localDateInTimezone(user.timezone);
    const doc = await getSessionDoc(ctx, args.clerkUserId, localDate);
    const session = doc ? sessionFromDoc(doc) : emptyDay(localDate);
    const habits = await listHabits(ctx, args.clerkUserId);
    const habitsById = new Map(habits.map((habit) => [habit.id, habit]));

    return {
      localDate,
      phase: session.phase,
      offeredHabits: session.offeredIds
        .map((habitId) => habitsById.get(habitId))
        .filter((habit) => habit !== undefined),
      selectedHabits: session.selectedIds
        .map((habitId) => habitsById.get(habitId))
        .filter((habit) => habit !== undefined),
      committedHabits: session.committedIds.map((habitId) => {
        const currentHabit = habitsById.get(habitId);
        const snapshot = session.committedHabitSnapshots.find(
          (habit) => habit.habitId === habitId,
        );

        return (
          currentHabit ?? {
            id: habitId,
            name: snapshot?.name ?? habitId,
            glyph: snapshot?.glyph ?? "symbol:spark",
            category: "life" as const,
            pointValue: getHabitPointValue(undefined, habitId),
          }
        );
      }),
      completedHabitIds: session.completedIds,
      complete: session.phase === "complete",
    };
  },
});

const startRevealForUser = async (
  ctx: MutationCtx,
  clerkUserId: string,
  args: { localDate: string },
) => {
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
};

export const startRevealMutation = mutation({
  args: { localDate: v.string() },
  handler: async (ctx, args) => {
    return await startRevealForUser(ctx, await requireClerkUserId(ctx), args);
  },
});

export const startRevealForRemoteMcp = internalMutation({
  args: { clerkUserId: v.string(), localDate: v.string() },
  handler: async (ctx, args) => {
    return await startRevealForUser(ctx, args.clerkUserId, args);
  },
});

const toggleSelectForUser = async (
  ctx: MutationCtx,
  clerkUserId: string,
  args: { localDate: string; habitId: string },
  selected?: boolean,
) => {
  const user = await requireUser(ctx, clerkUserId);
  const sessionLocalDate = requireSavedTimezoneToday(
    args.localDate,
    user.timezone,
  );
  const doc = await getSessionDoc(ctx, clerkUserId, sessionLocalDate);

  if (!doc) {
    throw new Error("No day session");
  }

  if (
    selected !== undefined &&
    doc.selectedIds.includes(args.habitId) === selected
  ) {
    return;
  }

  const next = ritualToggleSelect(sessionFromDoc(doc), args.habitId);
  await ctx.db.patch(doc._id, next);
};

export const toggleSelect = mutation({
  args: { localDate: v.string(), habitId: v.string() },
  handler: async (ctx, args) => {
    await toggleSelectForUser(ctx, await requireClerkUserId(ctx), args);
  },
});

export const setSelectionForRemoteMcp = internalMutation({
  args: {
    clerkUserId: v.string(),
    localDate: v.string(),
    habitId: v.string(),
    selected: v.boolean(),
  },
  handler: async (ctx, args) => {
    await toggleSelectForUser(ctx, args.clerkUserId, args, args.selected);
  },
});

const commitForUser = async (
  ctx: MutationCtx,
  clerkUserId: string,
  args: { localDate: string },
) => {
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
};

export const commit = mutation({
  args: { localDate: v.string() },
  handler: async (ctx, args) => {
    await commitForUser(ctx, await requireClerkUserId(ctx), args);
  },
});

export const commitForRemoteMcp = internalMutation({
  args: { clerkUserId: v.string(), localDate: v.string() },
  handler: async (ctx, args) => {
    await commitForUser(ctx, args.clerkUserId, args);
  },
});

const toggleCompleteForUser = async (
  ctx: MutationCtx,
  clerkUserId: string,
  args: { localDate: string; habitId: string },
  completed?: boolean,
) => {
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

  if (
    completed !== undefined &&
    before.completedIds.includes(args.habitId) === completed
  ) {
    return;
  }

  const next = ritualToggleComplete(before, args.habitId);
  const isFirstCheckoff = !before.completedIds.includes(args.habitId);
  const completedOrbit =
    before.phase !== "complete" && next.phase === "complete";
  const uncheckedCompletedOrbit =
    before.phase === "complete" && next.phase === "active";

  if (isFirstCheckoff) {
    const habit = await ctx.db
      .query("habits")
      .withIndex("by_clerkUserId_habitKey", (q) =>
        q.eq("clerkUserId", clerkUserId).eq("habitKey", args.habitId),
      )
      .unique();
    const committedHabitSnapshot = before.committedHabitSnapshots?.find(
      (snapshot) => snapshot.habitId === args.habitId,
    );

    if (!habit && !committedHabitSnapshot) {
      throw new Error("Habit not found");
    }

    const pointValue =
      before.committedPointValues.find(
        (snapshot) => snapshot.habitId === args.habitId,
      )?.points ?? getHabitPointValue(undefined, args.habitId);

    await insertSessionPointAward(ctx, clerkUserId, user._id, doc._id, {
      amount: pointValue,
      sourceType: "habit_award",
      sourceName: habit?.name ?? committedHabitSnapshot?.name ?? args.habitId,
      localDate: sessionLocalDate,
      idempotencyKey: habitAwardIdempotencyKey(sessionLocalDate, args.habitId),
    });
  }

  if (!isFirstCheckoff) {
    const award = await getHabitAward(
      ctx,
      clerkUserId,
      sessionLocalDate,
      args.habitId,
    );

    if (award?.sourceType === "habit_award" && award.amount > 0) {
      await insertSessionPointTransaction(ctx, clerkUserId, user._id, doc._id, {
        amount: -award.amount,
        sourceType: "habit_award",
        sourceName: award.sourceName,
        localDate: sessionLocalDate,
        idempotencyKey: habitAwardReversalIdempotencyKey(award.idempotencyKey),
      });
    }
  }

  if (uncheckedCompletedOrbit) {
    const completionBonus = await getCompletionBonus(
      ctx,
      clerkUserId,
      sessionLocalDate,
    );

    if (
      completionBonus?.sourceType === "completion_bonus" &&
      completionBonus.amount > 0
    ) {
      await insertSessionPointTransaction(ctx, clerkUserId, user._id, doc._id, {
        amount: -completionBonus.amount,
        sourceType: "completion_bonus",
        sourceName: completionBonus.sourceName,
        localDate: sessionLocalDate,
        idempotencyKey: completionBonusReversalIdempotencyKey(sessionLocalDate),
      });
    }

    if (user.lastCompletedLocalDate === sessionLocalDate) {
      const previousCompletedSession = await ctx.db
        .query("daySessions")
        .withIndex("by_clerkUserId_localDate", (q) =>
          q.eq("clerkUserId", clerkUserId).lt("localDate", sessionLocalDate),
        )
        .order("desc")
        .filter((q) => q.eq(q.field("phase"), "complete"))
        .first();
      const stats = revertCompletionStats(
        {
          streak: user.streak,
          daysCompleted: user.daysCompleted,
          lastCompletedLocalDate: user.lastCompletedLocalDate,
        },
        sessionLocalDate,
        previousCompletedSession?.localDate ?? null,
      );

      await ctx.db.patch(user._id, {
        streak: stats.streak,
        daysCompleted: stats.daysCompleted,
        lastCompletedLocalDate: stats.lastCompletedLocalDate,
      });
    }
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
};

export const toggleComplete = mutation({
  args: { localDate: v.string(), habitId: v.string() },
  handler: async (ctx, args) => {
    await toggleCompleteForUser(ctx, await requireClerkUserId(ctx), args);
  },
});

export const setCompleteForRemoteMcp = internalMutation({
  args: {
    clerkUserId: v.string(),
    localDate: v.string(),
    habitId: v.string(),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    await toggleCompleteForUser(ctx, args.clerkUserId, args, args.completed);
  },
});

const rerevealForUser = async (
  ctx: MutationCtx,
  clerkUserId: string,
  args: { localDate: string },
) => {
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
};

export const rereveal = mutation({
  args: { localDate: v.string() },
  handler: async (ctx, args) => {
    await rerevealForUser(ctx, await requireClerkUserId(ctx), args);
  },
});

export const rerevealForRemoteMcp = internalMutation({
  args: { clerkUserId: v.string(), localDate: v.string() },
  handler: async (ctx, args) => {
    await rerevealForUser(ctx, args.clerkUserId, args);
  },
});
