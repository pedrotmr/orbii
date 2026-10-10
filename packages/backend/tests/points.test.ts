/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { afterEach, expect, test, vi } from "vitest";
import { api } from "../convex/_generated/api";
import schema from "../convex/schema";

const modules = import.meta.glob("../convex/**/*.ts");

const insertUser = async (
  t: ReturnType<typeof convexTest>,
  clerkUserId: string,
  timezone = "UTC",
) => {
  await t.run(async (ctx) => {
    await ctx.db.insert("users", {
      clerkUserId,
      capacity: 2,
      timezone,
      streak: 0,
      daysCompleted: 0,
      lastCompletedLocalDate: null,
    });
  });
};

const withIdentity = (t: ReturnType<typeof convexTest>, subject: string) => {
  return t.withIdentity({ subject, tokenIdentifier: subject });
};

afterEach(() => {
  vi.useRealTimers();
});

test("new and legacy habits default to Medium and starter seeds keep their authored values", async () => {
  const t = convexTest(schema, modules);
  const owner = withIdentity(t, "owner");
  await insertUser(t, "owner");
  await t.run(async (ctx) => {
    await ctx.db.insert("habits", {
      clerkUserId: "owner",
      habitKey: "legacy",
      name: "Legacy",
      glyph: "symbol:spark",
      category: "life",
    });
    await ctx.db.insert("habits", {
      clerkUserId: "owner",
      habitKey: "water",
      name: "Drink water",
      glyph: "💧",
      category: "life",
    });
  });

  await owner.mutation(api.habits.add, {
    habitKey: "custom",
    name: "Custom",
    glyph: "symbol:spark",
    category: "life",
  });
  await owner.mutation(api.habits.seedStarters, {
    habitKeys: ["walk", "read"],
  });

  const habits = await owner.query(api.habits.list, {});
  expect(habits.find((habit) => habit.id === "legacy")?.pointValue).toBe(20);
  expect(habits.find((habit) => habit.id === "water")?.pointValue).toBe(10);
  expect(habits.find((habit) => habit.id === "custom")?.pointValue).toBe(20);
  expect(habits.find((habit) => habit.id === "walk")?.pointValue).toBe(10);
  expect(habits.find((habit) => habit.id === "read")?.pointValue).toBe(20);
  await expect(owner.query(api.users.get, {})).resolves.toMatchObject({
    pointsBalance: 0,
  });
});

test("habit point values accept whole numbers from 1 through 100 and remain owner-scoped", async () => {
  const t = convexTest(schema, modules);
  const owner = withIdentity(t, "owner");
  const otherUser = withIdentity(t, "other-user");
  await owner.mutation(api.habits.add, {
    habitKey: "custom",
    name: "Custom",
    glyph: "symbol:spark",
    category: "life",
    pointValue: 1,
  });

  await owner.mutation(api.habits.update, {
    habitKey: "custom",
    name: "Custom",
    glyph: "symbol:spark",
    category: "life",
    pointValue: 100,
  });
  await expect(owner.query(api.habits.list, {})).resolves.toMatchObject([
    { id: "custom", pointValue: 100 },
  ]);

  for (const pointValue of [0, 101, 10.5]) {
    await expect(
      owner.mutation(api.habits.update, {
        habitKey: "custom",
        name: "Custom",
        glyph: "symbol:spark",
        category: "life",
        pointValue,
      }),
    ).rejects.toThrow("Point value must be a whole number from 1 to 100");
  }

  await expect(
    otherUser.mutation(api.habits.update, {
      habitKey: "custom",
      name: "Custom",
      glyph: "symbol:spark",
      category: "life",
      pointValue: 30,
    }),
  ).rejects.toThrow("Habit not found");
});

test("a commitment snapshot awards once per saved session date across edits and re-reveal", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T20:00:00.000Z"));
  const t = convexTest(schema, modules);
  const owner = withIdentity(t, "owner");
  const otherUser = withIdentity(t, "other-user");
  await insertUser(t, "owner", "America/Los_Angeles");
  await insertUser(t, "other-user", "America/Los_Angeles");
  await owner.mutation(api.habits.add, {
    habitKey: "walk",
    name: "Walk",
    glyph: "symbol:walk",
    category: "body",
    pointValue: 10,
  });
  await owner.mutation(api.habits.add, {
    habitKey: "read",
    name: "Read",
    glyph: "symbol:book",
    category: "learn",
    pointValue: 30,
  });

  const firstSessionDate = "1999-07-03";
  await owner.mutation(api.day.startRevealMutation, {
    localDate: firstSessionDate,
  });
  const reveal = await owner.query(api.day.get, {
    localDate: firstSessionDate,
  });
  expect(reveal?.session.offeredIds).toEqual(
    expect.arrayContaining(["walk", "read"]),
  );
  await owner.mutation(api.day.toggleSelect, {
    localDate: firstSessionDate,
    habitId: "walk",
  });
  await owner.mutation(api.day.toggleSelect, {
    localDate: firstSessionDate,
    habitId: "read",
  });
  await owner.mutation(api.day.commit, { localDate: firstSessionDate });

  await expect(
    otherUser.mutation(api.day.toggleComplete, {
      localDate: firstSessionDate,
      habitId: "walk",
    }),
  ).rejects.toThrow("No day session");
  await expect(otherUser.query(api.users.get, {})).resolves.toMatchObject({
    pointsBalance: 0,
  });

  const committed = await owner.query(api.day.get, {
    localDate: firstSessionDate,
  });
  expect(committed?.session.committedPointValues).toEqual([
    { habitId: "walk", points: 10 },
    { habitId: "read", points: 30 },
  ]);

  await owner.mutation(api.habits.update, {
    habitKey: "walk",
    name: "Long walk",
    glyph: "symbol:walk",
    category: "body",
    pointValue: 40,
  });
  await owner.mutation(api.day.toggleComplete, {
    localDate: firstSessionDate,
    habitId: "walk",
  });
  await expect(owner.query(api.users.get, {})).resolves.toMatchObject({
    pointsBalance: 10,
  });

  await owner.mutation(api.day.toggleComplete, {
    localDate: firstSessionDate,
    habitId: "walk",
  });
  await owner.mutation(api.day.toggleComplete, {
    localDate: firstSessionDate,
    habitId: "walk",
  });
  await expect(owner.query(api.users.get, {})).resolves.toMatchObject({
    pointsBalance: 10,
  });

  await owner.mutation(api.day.rereveal, { localDate: firstSessionDate });
  const rerevealed = await owner.query(api.day.get, {
    localDate: firstSessionDate,
  });
  expect(rerevealed?.session.committedPointValues).toEqual([]);
  await owner.mutation(api.day.toggleSelect, {
    localDate: firstSessionDate,
    habitId: "walk",
  });
  await owner.mutation(api.day.commit, { localDate: firstSessionDate });
  await owner.mutation(api.day.toggleComplete, {
    localDate: firstSessionDate,
    habitId: "walk",
  });
  const nextSessionDate = "1999-07-04";
  vi.setSystemTime(new Date("2026-01-02T20:00:00.000Z"));
  await owner.mutation(api.day.startRevealMutation, {
    localDate: nextSessionDate,
  });
  await owner.mutation(api.day.toggleSelect, {
    localDate: nextSessionDate,
    habitId: "walk",
  });
  await owner.mutation(api.day.commit, { localDate: nextSessionDate });
  await owner.mutation(api.day.toggleComplete, {
    localDate: nextSessionDate,
    habitId: "walk",
  });
  await owner.mutation(api.habits.remove, {
    habitKey: "walk",
    localDate: nextSessionDate,
  });

  const pointTransactions = await t.run(async (ctx) => {
    return await ctx.db
      .query("pointTransactions")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", "owner"))
      .collect();
  });
  const habitTransactions = pointTransactions.filter(
    (transaction) => transaction.sourceType === "habit_award",
  );
  expect(habitTransactions).toHaveLength(2);
  expect(habitTransactions.map(({ amount }) => amount).sort()).toEqual([
    10, 40,
  ]);
  expect(habitTransactions.map(({ sourceName }) => sourceName)).toEqual([
    "Long walk",
    "Long walk",
  ]);
  expect(
    habitTransactions.map(({ idempotencyKey }) => idempotencyKey).sort(),
  ).toEqual([
    `habit:${firstSessionDate}:walk`,
    `habit:${nextSessionDate}:walk`,
  ]);
  const completionTransactions = pointTransactions.filter(
    (transaction) => transaction.sourceType === "completion_bonus",
  );
  expect(completionTransactions).toHaveLength(2);
  expect(completionTransactions.map(({ amount }) => amount)).toEqual([20, 20]);
  expect(
    completionTransactions.map(({ idempotencyKey }) => idempotencyKey).sort(),
  ).toEqual([
    `completion:${firstSessionDate}`,
    `completion:${nextSessionDate}`,
  ]);
  expect(new Set(pointTransactions.map(({ localDate }) => localDate))).toEqual(
    new Set([firstSessionDate, nextSessionDate]),
  );
  expect(habitTransactions.map(({ localDate }) => localDate).sort()).toEqual([
    firstSessionDate,
    nextSessionDate,
  ]);
  await expect(owner.query(api.users.get, {})).resolves.toMatchObject({
    pointsBalance: 90,
  });
});

test("only full completion earns one timezone-local bonus and daily earned total", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T07:30:00.000Z"));
  const t = convexTest(schema, modules);
  const owner = withIdentity(t, "owner");
  await insertUser(t, "owner", "America/Los_Angeles");
  await owner.mutation(api.habits.add, {
    habitKey: "walk",
    name: "Walk",
    glyph: "symbol:walk",
    category: "body",
    pointValue: 10,
  });
  await owner.mutation(api.habits.add, {
    habitKey: "read",
    name: "Read",
    glyph: "symbol:book",
    category: "learn",
    pointValue: 30,
  });

  const firstLocalDate = "2025-12-31";
  await owner.mutation(api.day.startRevealMutation, {
    localDate: firstLocalDate,
  });
  await owner.mutation(api.day.toggleSelect, {
    localDate: firstLocalDate,
    habitId: "walk",
  });
  await owner.mutation(api.day.toggleSelect, {
    localDate: firstLocalDate,
    habitId: "read",
  });
  await owner.mutation(api.day.commit, { localDate: firstLocalDate });
  await owner.mutation(api.day.toggleComplete, {
    localDate: firstLocalDate,
    habitId: "walk",
  });

  await expect(owner.query(api.users.get, {})).resolves.toMatchObject({
    pointsBalance: 10,
  });
  await expect(
    owner.query(api.day.get, { localDate: firstLocalDate }),
  ).resolves.toMatchObject({
    session: { phase: "active" },
    earnedPoints: 10,
  });

  await owner.mutation(api.day.toggleComplete, {
    localDate: firstLocalDate,
    habitId: "read",
  });
  await expect(
    owner.query(api.day.get, { localDate: firstLocalDate }),
  ).resolves.toMatchObject({
    session: { phase: "complete" },
    earnedPoints: 60,
  });
  await expect(owner.query(api.users.get, {})).resolves.toMatchObject({
    pointsBalance: 60,
  });

  await expect(
    owner.mutation(api.day.toggleComplete, {
      localDate: firstLocalDate,
      habitId: "read",
    }),
  ).rejects.toThrow("Can only complete during active");
  await expect(
    owner.mutation(api.day.startRevealMutation, { localDate: firstLocalDate }),
  ).rejects.toThrow("Day already complete");
  const firstDayTransactions = await t.run(async (ctx) => {
    return await ctx.db
      .query("pointTransactions")
      .withIndex("by_clerkUserId_localDate", (q) =>
        q.eq("clerkUserId", "owner").eq("localDate", firstLocalDate),
      )
      .collect();
  });
  expect(
    firstDayTransactions.filter(
      (transaction) => transaction.sourceType === "completion_bonus",
    ),
  ).toMatchObject([
    {
      amount: 20,
      sourceName: "Completion bonus",
      localDate: firstLocalDate,
      idempotencyKey: `completion:${firstLocalDate}`,
    },
  ]);

  await t.run(async (ctx) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", "owner"))
      .unique();
    if (!user) {
      throw new Error("User not found");
    }
    await ctx.db.insert("pointTransactions", {
      clerkUserId: "owner",
      amount: -15,
      sourceType: "reward_redemption",
      sourceName: "Tea",
      localDate: firstLocalDate,
      idempotencyKey: "redemption:tea",
    });
    await ctx.db.patch(user._id, { pointsBalance: 45 });
  });
  await expect(
    owner.query(api.day.get, { localDate: firstLocalDate }),
  ).resolves.toMatchObject({ earnedPoints: 60 });

  vi.setSystemTime(new Date("2026-01-02T07:30:00.000Z"));
  const nextLocalDate = "2026-01-01";
  await owner.mutation(api.day.startRevealMutation, {
    localDate: nextLocalDate,
  });
  await owner.mutation(api.day.toggleSelect, {
    localDate: nextLocalDate,
    habitId: "walk",
  });
  await owner.mutation(api.day.commit, { localDate: nextLocalDate });
  await owner.mutation(api.day.toggleComplete, {
    localDate: nextLocalDate,
    habitId: "walk",
  });

  const nextDay = await owner.query(api.day.get, { localDate: nextLocalDate });
  expect(nextDay?.earnedPoints).toBe(30);
  await expect(owner.query(api.users.get, {})).resolves.toMatchObject({
    pointsBalance: 75,
  });
  const nextDayTransactions = await t.run(async (ctx) => {
    return await ctx.db
      .query("pointTransactions")
      .withIndex("by_clerkUserId_localDate", (q) =>
        q.eq("clerkUserId", "owner").eq("localDate", nextLocalDate),
      )
      .collect();
  });
  expect(
    nextDayTransactions.filter(
      (transaction) => transaction.sourceType === "completion_bonus",
    ),
  ).toMatchObject([
    {
      amount: 20,
      sourceName: "Completion bonus",
      localDate: nextLocalDate,
      idempotencyKey: `completion:${nextLocalDate}`,
    },
  ]);
});

test("catch-up completion awards and daily earned points use the saved session date", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T07:30:00.000Z"));
  const t = convexTest(schema, modules);
  const owner = withIdentity(t, "owner");
  await insertUser(t, "owner", "America/Los_Angeles");
  await owner.mutation(api.habits.add, {
    habitKey: "walk",
    name: "Walk",
    glyph: "symbol:walk",
    category: "body",
    pointValue: 10,
  });

  const sessionLocalDate = "2025-12-30";
  const physicalLocalDate = "2025-12-31";
  await owner.mutation(api.day.startRevealMutation, {
    localDate: sessionLocalDate,
  });
  await owner.mutation(api.day.toggleSelect, {
    localDate: sessionLocalDate,
    habitId: "walk",
  });
  await owner.mutation(api.day.commit, { localDate: sessionLocalDate });
  await owner.mutation(api.day.toggleComplete, {
    localDate: sessionLocalDate,
    habitId: "walk",
  });

  const sessionTransactions = await t.run(async (ctx) => {
    return await ctx.db
      .query("pointTransactions")
      .withIndex("by_clerkUserId_localDate", (q) =>
        q.eq("clerkUserId", "owner").eq("localDate", sessionLocalDate),
      )
      .collect();
  });
  expect(sessionTransactions).toHaveLength(2);
  expect(
    sessionTransactions.map(({ idempotencyKey }) => idempotencyKey).sort(),
  ).toEqual([
    `completion:${sessionLocalDate}`,
    `habit:${sessionLocalDate}:walk`,
  ]);
  const bonus = sessionTransactions.find(
    (transaction) => transaction.sourceType === "completion_bonus",
  );
  expect(bonus).toMatchObject({
    amount: 20,
    sourceType: "completion_bonus",
    sourceName: "Completion bonus",
    localDate: sessionLocalDate,
    idempotencyKey: `completion:${sessionLocalDate}`,
  });
  await expect(
    owner.query(api.day.get, { localDate: sessionLocalDate }),
  ).resolves.toMatchObject({
    session: { localDate: sessionLocalDate, phase: "complete" },
    earnedPoints: 30,
  });
  await expect(
    owner.query(api.day.get, { localDate: physicalLocalDate }),
  ).resolves.toMatchObject({
    session: { localDate: physicalLocalDate, phase: "idle" },
    earnedPoints: 0,
  });
  await expect(owner.query(api.users.get, {})).resolves.toMatchObject({
    pointsBalance: 30,
    lastCompletedLocalDate: sessionLocalDate,
  });
});
