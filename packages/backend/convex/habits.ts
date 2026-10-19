import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { requireClerkUserId } from "./lib/auth";
import {
  nextHabitOrder,
  sortHabitsByOrder,
  starterHabitPointValue,
  STARTER_HABITS,
} from "./lib/habits";
import {
  DEFAULT_HABIT_POINT_VALUE,
  getHabitPointValue,
  insertCompletionBonus,
  validateHabitPointValue,
} from "./lib/points";
import { REMOTE_MCP_REQUEST_RETENTION_MS } from "./lib/remote_mcp_idempotency";
import { applyCompletionStats, scrubHabitFromSession } from "./lib/ritual";
import { requireSavedTimezoneToday } from "./lib/timezone";

const MAX_HABIT_NAME_LENGTH = 50;
const MAX_HABIT_GLYPH_LENGTH = 50;
const HABITS_PER_ORDER_BACKFILL_BATCH = 20;

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

const listHabitsForUser = async (
  ctx: QueryCtx | MutationCtx,
  clerkUserId: string,
) => {
  const rows = await ctx.db
    .query("habits")
    .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
    .collect();

  return sortHabitsByOrder(rows).map((row) => ({
    id: row.habitKey,
    name: row.name,
    glyph: row.glyph,
    category: row.category,
    pointValue: getHabitPointValue(row.pointValue, row.habitKey),
  }));
};

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await listHabitsForUser(ctx, await requireClerkUserId(ctx));
  },
});

export const listForRemoteMcp = internalQuery({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    return await listHabitsForUser(ctx, args.clerkUserId);
  },
});

const addHabitForUser = async (
  ctx: MutationCtx,
  clerkUserId: string,
  args: {
    habitKey: string;
    name: string;
    glyph: string;
    category: "body" | "mind" | "learn" | "life";
    pointValue?: number;
  },
) => {
  const { name, glyph } = validateHabitDetails(args.name, args.glyph);
  const pointValue = validateHabitPointValue(
    args.pointValue ?? DEFAULT_HABIT_POINT_VALUE,
  );
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
    pointValue,
  });
};

export const add = mutation({
  args: {
    habitKey: v.string(),
    name: v.string(),
    glyph: v.string(),
    category: habitCategoryValidator,
    pointValue: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await addHabitForUser(ctx, await requireClerkUserId(ctx), args);
  },
});

export const addForRemoteMcp = internalMutation({
  args: {
    clerkUserId: v.string(),
    clientId: v.optional(v.string()),
    requestId: v.optional(v.string()),
    habitKey: v.string(),
    name: v.string(),
    glyph: v.string(),
    category: habitCategoryValidator,
    now: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const clientId = args.clientId;
    const requestId = args.requestId;

    if ((clientId === undefined) !== (requestId === undefined)) {
      throw new Error("MCP request identity is incomplete");
    }

    const { name, glyph } = validateHabitDetails(args.name, args.glyph);
    const now = args.now ?? Date.now();

    if (clientId !== undefined && requestId !== undefined) {
      const expiredRequests = await ctx.db
        .query("remoteMcpHabitRequests")
        .withIndex("by_clerkUserId_clientId_createdAt", (q) =>
          q
            .eq("clerkUserId", args.clerkUserId)
            .eq("clientId", clientId)
            .lt("createdAt", now - REMOTE_MCP_REQUEST_RETENTION_MS),
        )
        .collect();

      for (const request of expiredRequests) {
        await ctx.db.delete(request._id);
      }

      const existingRequest = await ctx.db
        .query("remoteMcpHabitRequests")
        .withIndex("by_clerkUserId_clientId_requestId", (q) =>
          q
            .eq("clerkUserId", args.clerkUserId)
            .eq("clientId", clientId)
            .eq("requestId", requestId),
        )
        .unique();

      if (existingRequest) {
        if (
          existingRequest.name !== name ||
          existingRequest.glyph !== glyph ||
          existingRequest.category !== args.category
        ) {
          throw new Error("MCP request ID was reused for another habit");
        }

        const existingHabit = await ctx.db
          .query("habits")
          .withIndex("by_clerkUserId_habitKey", (q) =>
            q
              .eq("clerkUserId", args.clerkUserId)
              .eq("habitKey", existingRequest.habitKey),
          )
          .unique();

        return existingHabit?._id ?? null;
      }
    }

    const habitId = await addHabitForUser(ctx, args.clerkUserId, {
      habitKey: args.habitKey,
      name,
      glyph,
      category: args.category,
    });

    if (clientId !== undefined && requestId !== undefined) {
      await ctx.db.insert("remoteMcpHabitRequests", {
        clerkUserId: args.clerkUserId,
        clientId,
        requestId,
        name,
        glyph,
        category: args.category,
        habitKey: args.habitKey,
        createdAt: now,
      });
    }

    return habitId;
  },
});

export const update = mutation({
  args: {
    habitKey: v.string(),
    name: v.string(),
    glyph: v.string(),
    category: habitCategoryValidator,
    pointValue: v.optional(v.number()),
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
    const pointValue =
      args.pointValue === undefined
        ? undefined
        : validateHabitPointValue(args.pointValue);

    await ctx.db.patch(existing._id, {
      name,
      glyph,
      category: args.category,
      ...(pointValue === undefined ? {} : { pointValue }),
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
    const habitsPage = await ctx.db
      .query("habits")
      .order("asc")
      .paginate({
        numItems: HABITS_PER_ORDER_BACKFILL_BATCH,
        cursor: args.cursor ?? null,
      });
    let habitsUpdated = 0;
    const clerkUserIds = new Set(
      habitsPage.page.map((habit) => habit.clerkUserId),
    );

    for (const clerkUserId of clerkUserIds) {
      const habits = await ctx.db
        .query("habits")
        .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
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

    if (!habitsPage.isDone) {
      await ctx.scheduler.runAfter(0, internal.habits.backfillOrder, {
        cursor: habitsPage.continueCursor,
      });
    }

    return { habitsUpdated, isDone: habitsPage.isDone };
  },
});

const removeHabitForUser = async (
  ctx: MutationCtx,
  clerkUserId: string,
  args: { habitKey: string; localDate?: string },
) => {
  const existing = await ctx.db
    .query("habits")
    .withIndex("by_clerkUserId_habitKey", (q) =>
      q.eq("clerkUserId", clerkUserId).eq("habitKey", args.habitKey),
    )
    .unique();

  const sessionDoc = args.localDate
    ? await ctx.db
        .query("daySessions")
        .withIndex("by_clerkUserId_localDate", (q) =>
          q.eq("clerkUserId", clerkUserId).eq("localDate", args.localDate!),
        )
        .unique()
    : null;
  let user = null;
  let sessionLocalDate: string | null = null;

  if (sessionDoc && args.localDate) {
    user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
      .unique();

    if (!user) {
      throw new Error("User not found — call users.ensure first");
    }

    sessionLocalDate = requireSavedTimezoneToday(args.localDate, user.timezone);
  }

  const committedHabitSnapshots = sessionDoc?.committedHabitSnapshots ?? [];
  const shouldSnapshotDeletedCommittedHabit =
    existing &&
    sessionDoc?.phase === "complete" &&
    sessionDoc.committedIds.includes(args.habitKey) &&
    !committedHabitSnapshots.some(
      (snapshot) => snapshot.habitId === args.habitKey,
    );
  const nextCommittedHabitSnapshots = shouldSnapshotDeletedCommittedHabit
    ? [
        ...committedHabitSnapshots,
        {
          habitId: args.habitKey,
          name: existing.name,
          glyph: existing.glyph,
          category: existing.category,
        },
      ]
    : committedHabitSnapshots;

  if (existing) {
    await ctx.db.delete(existing._id);
  }

  if (!sessionDoc || !user || !sessionLocalDate) {
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
      committedPointValues:
        sessionDoc.committedPointValues ??
        sessionDoc.committedIds.map((habitId: string) => ({
          habitId,
          points: getHabitPointValue(undefined, habitId),
        })),
      committedHabitSnapshots: nextCommittedHabitSnapshots,
    },
    args.habitKey,
  );

  await ctx.db.patch(sessionDoc._id, {
    phase: scrubbed.phase,
    offeredIds: scrubbed.offeredIds,
    selectedIds: scrubbed.selectedIds,
    committedIds: scrubbed.committedIds,
    completedIds: scrubbed.completedIds,
    committedPointValues: scrubbed.committedPointValues,
    committedHabitSnapshots: scrubbed.committedHabitSnapshots,
  });

  if (!wasComplete && scrubbed.phase === "complete") {
    await insertCompletionBonus(
      ctx,
      clerkUserId,
      user._id,
      sessionDoc._id,
      sessionLocalDate,
    );
    const nextStats = applyCompletionStats(
      {
        streak: user.streak,
        daysCompleted: user.daysCompleted,
        lastCompletedLocalDate: user.lastCompletedLocalDate,
      },
      sessionLocalDate,
    );
    await ctx.db.patch(user._id, nextStats);
  }
};

export const remove = mutation({
  args: {
    habitKey: v.string(),
    localDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await removeHabitForUser(ctx, await requireClerkUserId(ctx), args);
  },
});

export const removeForRemoteMcp = internalMutation({
  args: {
    clerkUserId: v.string(),
    habitKey: v.string(),
    localDate: v.string(),
  },
  handler: async (ctx, args) => {
    await removeHabitForUser(ctx, args.clerkUserId, args);
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
        pointValue: starterHabitPointValue(starter.id),
      });
    }
  },
});
