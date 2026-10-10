/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { afterEach, expect, test, vi } from "vitest";
import { api } from "../convex/_generated/api";
import schema from "../convex/schema";

const modules = import.meta.glob("../convex/**/*.ts");

interface PointTransactionFixture {
  amount: number;
  sourceType: "habit_award" | "completion_bonus" | "reward_redemption";
  sourceName: string;
  localDate: string;
  idempotencyKey: string;
}

const insertTransaction = async (
  t: ReturnType<typeof convexTest>,
  clerkUserId: string,
  transaction: PointTransactionFixture,
) => {
  await t.run(async (ctx) => {
    await ctx.db.insert("pointTransactions", { clerkUserId, ...transaction });
  });
};

const insertUser = async (
  t: ReturnType<typeof convexTest>,
  clerkUserId: string,
  timezone: string,
) => {
  await t.run(async (ctx) => {
    await ctx.db.insert("users", {
      clerkUserId,
      capacity: 2,
      timezone,
      streak: 0,
      daysCompleted: 0,
      lastCompletedLocalDate: null,
      pointsBalance: 0,
    });
  });
};

const withIdentity = (t: ReturnType<typeof convexTest>, subject: string) => {
  return t.withIdentity({ subject, tokenIdentifier: subject });
};

afterEach(() => {
  vi.useRealTimers();
});

test("transaction history is owner-scoped and pages every signed row newest first", async () => {
  vi.useFakeTimers();
  const t = convexTest(schema, modules);
  const owner = withIdentity(t, "owner");
  const otherUser = withIdentity(t, "other-user");
  const expected = Array.from({ length: 137 }, (_, index) => ({
    amount: index % 2 === 0 ? 10 : -35,
    sourceType: ["habit_award", "completion_bonus", "reward_redemption"][
      index % 3
    ] as PointTransactionFixture["sourceType"],
    sourceName: `Transaction ${index}`,
    localDate: `2026-10-${String((index % 28) + 1).padStart(2, "0")}`,
    idempotencyKey: `transaction:${index}`,
  }));

  for (const [index, transaction] of expected.entries()) {
    vi.setSystemTime(new Date(Date.UTC(2026, 9, 1, 0, 0, index)));
    await insertTransaction(t, "owner", transaction);
  }

  vi.setSystemTime(new Date(Date.UTC(2026, 9, 2)));
  await insertTransaction(t, "other-user", {
    amount: 15,
    sourceType: "habit_award",
    sourceName: "Other user's walk",
    localDate: "2026-10-02",
    idempotencyKey: "other:walk",
  });

  const firstPage = await owner.query(api.points.listTransactions, {
    paginationOpts: { numItems: 37, cursor: null },
  });
  expect(firstPage.page).toHaveLength(37);
  expect(firstPage.page[0]).toMatchObject({
    amount: expected[136]?.amount,
    sourceName: "Transaction 136",
    localDate: expected[136]?.localDate,
  });
  expect(firstPage).not.toHaveProperty("pointsBalance");

  const history = [...firstPage.page];
  let cursor: string | null = firstPage.isDone
    ? null
    : firstPage.continueCursor;
  while (cursor !== null) {
    const nextPage = await owner.query(api.points.listTransactions, {
      paginationOpts: { numItems: 37, cursor },
    });
    history.push(...nextPage.page);
    cursor = nextPage.isDone ? null : nextPage.continueCursor;
  }

  expect(
    history.map(({ amount, sourceType, sourceName, localDate }) => ({
      amount,
      sourceType,
      sourceName,
      localDate,
    })),
  ).toEqual(
    [...expected]
      .reverse()
      .map(({ amount, sourceType, sourceName, localDate }) => ({
        amount,
        sourceType,
        sourceName,
        localDate,
      })),
  );
  await expect(
    otherUser.query(api.points.listTransactions, {
      paginationOpts: { numItems: 37, cursor: null },
    }),
  ).resolves.toMatchObject({
    page: [{ sourceName: "Other user's walk" }],
    isDone: true,
  });
  await expect(
    t.query(api.points.listTransactions, {
      paginationOpts: { numItems: 37, cursor: null },
    }),
  ).rejects.toThrow("Not authenticated");
});

test("history exposes the transaction-time source labels and saved local dates", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-01T19:00:00.000Z"));
  const t = convexTest(schema, modules);
  const owner = withIdentity(t, "owner");
  await insertUser(t, "owner", "America/Los_Angeles");
  await owner.mutation(api.habits.add, {
    habitKey: "read",
    name: "Read before commit",
    glyph: "symbol:book",
    category: "learn",
    pointValue: 10,
  });
  await owner.mutation(api.day.startRevealMutation, {
    localDate: "2026-10-01",
  });
  await owner.mutation(api.day.toggleSelect, {
    localDate: "2026-10-01",
    habitId: "read",
  });
  await owner.mutation(api.day.commit, { localDate: "2026-10-01" });
  await owner.mutation(api.habits.update, {
    habitKey: "read",
    name: "Read in sunlight",
    glyph: "symbol:book",
    category: "learn",
    pointValue: 40,
  });
  await owner.mutation(api.day.toggleComplete, {
    localDate: "2026-10-01",
    habitId: "read",
  });
  await owner.mutation(api.habits.update, {
    habitKey: "read",
    name: "Renamed after earning",
    glyph: "symbol:book",
    category: "learn",
    pointValue: 40,
  });

  const rewardId = await owner.mutation(api.rewards.create, {
    name: "Museum visit",
    cost: 20,
  });
  await owner.mutation(api.rewards.update, {
    rewardId,
    name: "Live music ticket",
    cost: 20,
  });
  vi.setSystemTime(new Date("2026-10-02T06:45:00.000Z"));
  await owner.mutation(api.rewards.redeem, { rewardId });

  const history = await owner.query(api.points.listTransactions, {
    paginationOpts: { numItems: 10, cursor: null },
  });
  expect(history.page[0]).toMatchObject({
    amount: -20,
    sourceType: "reward_redemption",
    sourceName: "Live music ticket",
    localDate: "2026-10-01",
  });
  expect(history.page).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        amount: 10,
        sourceType: "habit_award",
        sourceName: "Read in sunlight",
        localDate: "2026-10-01",
      }),
      expect.objectContaining({
        amount: 20,
        sourceType: "completion_bonus",
        sourceName: "Completion bonus",
        localDate: "2026-10-01",
      }),
    ]),
  );
});
