/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { afterEach, expect, test, vi } from "vitest";
import { api } from "../convex/_generated/api";
import { localDateInTimezone } from "../convex/lib/timezone";
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

test("a commitment snapshot awards once per saved-timezone day across edits and re-reveal", async () => {
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

  const clientLocalDate = "1999-07-03";
  await owner.mutation(api.day.startRevealMutation, {
    localDate: clientLocalDate,
  });
  const reveal = await owner.query(api.day.get, { localDate: clientLocalDate });
  expect(reveal?.session.offeredIds).toEqual(
    expect.arrayContaining(["walk", "read"]),
  );
  await owner.mutation(api.day.toggleSelect, {
    localDate: clientLocalDate,
    habitId: "walk",
  });
  await owner.mutation(api.day.toggleSelect, {
    localDate: clientLocalDate,
    habitId: "read",
  });
  await owner.mutation(api.day.commit, { localDate: clientLocalDate });

  await expect(
    otherUser.mutation(api.day.toggleComplete, {
      localDate: clientLocalDate,
      habitId: "walk",
    }),
  ).rejects.toThrow("No day session");
  await expect(otherUser.query(api.users.get, {})).resolves.toMatchObject({
    pointsBalance: 0,
  });

  const committed = await owner.query(api.day.get, {
    localDate: clientLocalDate,
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
    localDate: clientLocalDate,
    habitId: "walk",
  });
  await expect(owner.query(api.users.get, {})).resolves.toMatchObject({
    pointsBalance: 10,
  });

  await owner.mutation(api.day.toggleComplete, {
    localDate: clientLocalDate,
    habitId: "walk",
  });
  await owner.mutation(api.day.toggleComplete, {
    localDate: clientLocalDate,
    habitId: "walk",
  });
  await expect(owner.query(api.users.get, {})).resolves.toMatchObject({
    pointsBalance: 10,
  });

  await owner.mutation(api.day.rereveal, { localDate: clientLocalDate });
  const rerevealed = await owner.query(api.day.get, {
    localDate: clientLocalDate,
  });
  expect(rerevealed?.session.committedPointValues).toEqual([]);
  await owner.mutation(api.day.toggleSelect, {
    localDate: clientLocalDate,
    habitId: "walk",
  });
  await owner.mutation(api.day.commit, { localDate: clientLocalDate });
  await owner.mutation(api.day.toggleComplete, {
    localDate: clientLocalDate,
    habitId: "walk",
  });
  const nextClientLocalDate = "1999-07-04";
  vi.setSystemTime(new Date("2026-01-02T20:00:00.000Z"));
  await owner.mutation(api.day.startRevealMutation, {
    localDate: nextClientLocalDate,
  });
  await owner.mutation(api.day.toggleSelect, {
    localDate: nextClientLocalDate,
    habitId: "walk",
  });
  await owner.mutation(api.day.commit, { localDate: nextClientLocalDate });
  await owner.mutation(api.day.toggleComplete, {
    localDate: nextClientLocalDate,
    habitId: "walk",
  });
  await owner.mutation(api.habits.remove, {
    habitKey: "walk",
    localDate: nextClientLocalDate,
  });

  const pointTransactions = await t.run(async (ctx) => {
    return await ctx.db
      .query("pointTransactions")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", "owner"))
      .collect();
  });
  expect(pointTransactions).toHaveLength(2);
  expect(pointTransactions[0]).toMatchObject({
    amount: 10,
    sourceType: "habit_award",
    sourceName: "Long walk",
    idempotencyKey: expect.stringMatching(/^habit:/),
  });
  expect(pointTransactions[1]).toMatchObject({
    amount: 40,
    sourceType: "habit_award",
    sourceName: "Long walk",
    idempotencyKey: expect.stringMatching(/^habit:/),
  });
  expect(new Set(pointTransactions.map(({ localDate }) => localDate))).toEqual(
    new Set(["2026-01-01", "2026-01-02"]),
  );
  for (const transaction of pointTransactions) {
    expect(Number.isFinite(transaction._creationTime)).toBe(true);
    expect(transaction.localDate).not.toBe(clientLocalDate);
    expect(transaction.localDate).toBe(
      localDateInTimezone("America/Los_Angeles", transaction._creationTime),
    );
  }
  await expect(owner.query(api.users.get, {})).resolves.toMatchObject({
    pointsBalance: 50,
  });
});
