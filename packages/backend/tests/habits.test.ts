/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api, internal } from "../convex/_generated/api";
import schema from "../convex/schema";

const modules = import.meta.glob("../convex/**/*.ts");

const insertUser = async (
  t: ReturnType<typeof convexTest>,
  clerkUserId: string,
) => {
  await t.run(async (ctx) => {
    await ctx.db.insert("users", {
      clerkUserId,
      capacity: 2,
      timezone: "UTC",
      streak: 0,
      daysCompleted: 0,
      lastCompletedLocalDate: null,
    });
  });
};

const insertHabit = async (
  t: ReturnType<typeof convexTest>,
  clerkUserId: string,
  habitKey: string,
  order?: number,
) => {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("habits", {
      clerkUserId,
      habitKey,
      name: habitKey,
      glyph: "symbol:spark",
      category: "life",
      ...(order === undefined ? {} : { order }),
    });
  });
};

const withIdentity = (t: ReturnType<typeof convexTest>, subject: string) => {
  return t.withIdentity({ subject, tokenIdentifier: subject });
};

test("habit updates enforce ownership and validate names and icons", async () => {
  const t = convexTest(schema, modules);
  const owner = withIdentity(t, "owner");
  const otherUser = withIdentity(t, "other-user");
  await insertHabit(t, "owner", "walk");

  await owner.mutation(api.habits.update, {
    habitKey: "walk",
    name: "  Take a walk  ",
    glyph: "  symbol:walk  ",
    category: "body",
  });

  await expect(owner.query(api.habits.list, {})).resolves.toMatchObject([
    {
      id: "walk",
      name: "Take a walk",
      glyph: "symbol:walk",
      category: "body",
    },
  ]);
  await expect(
    otherUser.mutation(api.habits.update, {
      habitKey: "walk",
      name: "Someone else’s walk",
      glyph: "symbol:walk",
      category: "body",
    }),
  ).rejects.toThrow("Habit not found");
  await expect(
    owner.mutation(api.habits.update, {
      habitKey: "walk",
      name: "   ",
      glyph: "symbol:walk",
      category: "body",
    }),
  ).rejects.toThrow("Habit name must be between 1 and 50 characters");
  await expect(
    owner.mutation(api.habits.update, {
      habitKey: "walk",
      name: "x".repeat(51),
      glyph: "symbol:walk",
      category: "body",
    }),
  ).rejects.toThrow("Habit name must be between 1 and 50 characters");
  await expect(
    owner.mutation(api.habits.update, {
      habitKey: "walk",
      name: "Take a walk",
      glyph: "   ",
      category: "body",
    }),
  ).rejects.toThrow("Habit icon is invalid");
  await expect(
    t.mutation(api.habits.update, {
      habitKey: "walk",
      name: "Take a walk",
      glyph: "symbol:walk",
      category: "body",
    }),
  ).rejects.toThrow("Not authenticated");
});

test("new habits append to the Orbit and reordering persists", async () => {
  const t = convexTest(schema, modules);
  const owner = withIdentity(t, "owner");
  await insertHabit(t, "owner", "first", 0);
  await insertHabit(t, "owner", "second", 1);

  await owner.mutation(api.habits.add, {
    habitKey: "third",
    name: "Third",
    glyph: "symbol:spark",
    category: "mind",
  });

  await expect(owner.query(api.habits.list, {})).resolves.toMatchObject([
    { id: "first" },
    { id: "second" },
    { id: "third" },
  ]);

  await owner.mutation(api.habits.reorder, {
    habitKeys: ["third", "first", "second"],
  });

  await expect(owner.query(api.habits.list, {})).resolves.toMatchObject([
    { id: "third" },
    { id: "first" },
    { id: "second" },
  ]);
  await expect(
    owner.mutation(api.habits.reorder, {
      habitKeys: ["first", "first", "third"],
    }),
  ).rejects.toThrow("Habit order must include each Orbit habit exactly once");
});

test("order backfill uses creation order and preserves later manual order", async () => {
  const t = convexTest(schema, modules);
  const owner = withIdentity(t, "owner");
  await insertUser(t, "owner");
  await insertHabit(t, "owner", "first");
  await insertHabit(t, "owner", "second");
  await insertHabit(t, "owner", "third");

  await t.mutation(internal.habits.backfillOrder, {});

  await expect(owner.query(api.habits.list, {})).resolves.toMatchObject([
    { id: "first" },
    { id: "second" },
    { id: "third" },
  ]);

  await owner.mutation(api.habits.reorder, {
    habitKeys: ["third", "first", "second"],
  });
  await t.mutation(internal.habits.backfillOrder, {});

  await expect(owner.query(api.habits.list, {})).resolves.toMatchObject([
    { id: "third" },
    { id: "first" },
    { id: "second" },
  ]);
});

test("order backfill includes habits whose owner has no user record", async () => {
  const t = convexTest(schema, modules);
  const owner = withIdentity(t, "owner-without-user-record");
  const firstHabitId = await insertHabit(
    t,
    "owner-without-user-record",
    "first",
  );
  const secondHabitId = await insertHabit(
    t,
    "owner-without-user-record",
    "second",
  );

  await t.mutation(internal.habits.backfillOrder, {});

  await expect(
    t.run(async (ctx) => ({
      first: (await ctx.db.get(firstHabitId))?.order,
      second: (await ctx.db.get(secondHabitId))?.order,
    })),
  ).resolves.toEqual({ first: 0, second: 1 });

  await expect(owner.query(api.habits.list, {})).resolves.toMatchObject([
    { id: "first" },
    { id: "second" },
  ]);
});
