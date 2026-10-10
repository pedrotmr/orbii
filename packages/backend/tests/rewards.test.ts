/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { expect, test, vi } from "vitest";
import type { Id } from "../convex/_generated/dataModel";
import { api } from "../convex/_generated/api";
import schema from "../convex/schema";

const modules = import.meta.glob("../convex/**/*.ts");

const insertUser = async (
  t: ReturnType<typeof convexTest>,
  clerkUserId: string,
  pointsBalance = 0,
  rewardsVisible?: boolean,
) => {
  await t.run(async (ctx) => {
    await ctx.db.insert("users", {
      clerkUserId,
      capacity: 2,
      timezone: "UTC",
      streak: 0,
      daysCompleted: 0,
      lastCompletedLocalDate: null,
      pointsBalance,
      ...(rewardsVisible === undefined ? {} : { rewardsVisible }),
    });
  });
};

const withIdentity = (t: ReturnType<typeof convexTest>, subject: string) => {
  return t.withIdentity({ subject, tokenIdentifier: subject });
};

const listRewards = async (
  t: ReturnType<typeof convexTest>,
  subject: string,
) => {
  return await withIdentity(t, subject).query(api.rewards.list, {
    paginationOpts: { numItems: 10, cursor: null },
  });
};

const listRedeemedRewards = async (
  t: ReturnType<typeof convexTest>,
  subject: string,
) => {
  return await withIdentity(t, subject).query(api.rewards.listRedeemed, {
    paginationOpts: { numItems: 10, cursor: null },
  });
};

test("creating rewards trims a required name and accepts positive integer costs without a product maximum", async () => {
  const t = convexTest(schema, modules);
  const owner = withIdentity(t, "owner");
  await insertUser(t, "owner", 250);

  await owner.mutation(api.rewards.create, {
    name: "  Pottery class  ",
    cost: 1_000_000,
  });

  await expect(listRewards(t, "owner")).resolves.toMatchObject({
    page: [{ name: "Pottery class", cost: 1_000_000 }],
    pointsBalance: 250,
  });

  for (const name of ["", "   "]) {
    await expect(
      owner.mutation(api.rewards.create, { name, cost: 20 }),
    ).rejects.toThrow("Reward name is required");
  }

  for (const cost of [0, -1, 2.5]) {
    await expect(
      owner.mutation(api.rewards.create, { name: "A reward", cost }),
    ).rejects.toThrow("Reward cost must be a positive whole number");
  }

  await expect(
    t.mutation(api.rewards.create, { name: "A reward", cost: 20 }),
  ).rejects.toThrow("Not authenticated");
});

test("reward edits and deletes are restricted to the owning user", async () => {
  const t = convexTest(schema, modules);
  const owner = withIdentity(t, "owner");
  const otherUser = withIdentity(t, "other-user");
  await insertUser(t, "owner", 80);
  await insertUser(t, "other-user", 10);
  const rewardId = await owner.mutation(api.rewards.create, {
    name: "Museum visit",
    cost: 120,
  });

  await expect(
    otherUser.mutation(api.rewards.update, {
      rewardId,
      name: "Someone else's visit",
      cost: 10,
    }),
  ).rejects.toThrow("Reward not found");
  await expect(
    otherUser.mutation(api.rewards.deleteReward, { rewardId }),
  ).rejects.toThrow("Reward not found");
  await expect(listRewards(t, "owner")).resolves.toMatchObject({
    page: [{ name: "Museum visit", cost: 120 }],
  });
  await expect(listRewards(t, "other-user")).resolves.toMatchObject({
    page: [],
  });
});

test("editing an active reward changes its name, cost, progress, and eligibility immediately", async () => {
  const t = convexTest(schema, modules);
  const owner = withIdentity(t, "owner");
  await insertUser(t, "owner", 245);
  const rewardId = await owner.mutation(api.rewards.create, {
    name: "Weekend away",
    cost: 380,
  });

  await expect(listRewards(t, "owner")).resolves.toMatchObject({
    page: [
      {
        name: "Weekend away",
        cost: 380,
        pointsProgress: 245,
        pointsRemaining: 135,
        isEligible: false,
      },
    ],
  });

  await owner.mutation(api.rewards.update, {
    rewardId,
    name: "  Quiet Saturday ",
    cost: 120,
  });

  await expect(listRewards(t, "owner")).resolves.toMatchObject({
    page: [
      {
        name: "Quiet Saturday",
        cost: 120,
        pointsProgress: 120,
        pointsRemaining: 0,
        isEligible: true,
      },
    ],
    pointsBalance: 245,
  });
  await expect(owner.query(api.users.get, {})).resolves.toMatchObject({
    pointsBalance: 245,
  });
});

test("every active reward progresses against the full shared balance without reserving points", async () => {
  const t = convexTest(schema, modules);
  const owner = withIdentity(t, "owner");
  await insertUser(t, "owner", 245);
  await owner.mutation(api.rewards.create, {
    name: "A small treat",
    cost: 100,
  });
  await owner.mutation(api.rewards.create, {
    name: "A bigger treat",
    cost: 300,
  });

  const result = await listRewards(t, "owner");
  expect(result.pointsBalance).toBe(245);
  expect(result.page).toEqual(
    expect.arrayContaining([
      {
        name: "A small treat",
        cost: 100,
        pointsProgress: 100,
        pointsRemaining: 0,
        isEligible: true,
        id: expect.any(String),
      },
      {
        name: "A bigger treat",
        cost: 300,
        pointsProgress: 245,
        pointsRemaining: 55,
        isEligible: false,
        id: expect.any(String),
      },
    ]),
  );
  await expect(owner.query(api.users.get, {})).resolves.toMatchObject({
    pointsBalance: 245,
  });
});

test("active reward pagination reaches every active goal and omits redeemed rewards", async () => {
  const t = convexTest(schema, modules);
  const owner = withIdentity(t, "owner");
  await insertUser(t, "owner", 0);
  const rewardIds: Id<"rewards">[] = [];

  for (let index = 0; index < 12; index += 1) {
    rewardIds.push(
      await owner.mutation(api.rewards.create, {
        name: "Goal " + String(index + 1),
        cost: index + 1,
      }),
    );
  }
  await t.run(async (ctx) => {
    await ctx.db.patch(rewardIds[0], {
      status: "redeemed",
      redeemedAt: 1_798_000_000_000,
      redeemedLocalDate: "2026-10-10",
    });
  });

  const firstPage = await owner.query(api.rewards.list, {
    paginationOpts: { numItems: 10, cursor: null },
  });
  const secondPage = await owner.query(api.rewards.list, {
    paginationOpts: {
      numItems: 10,
      cursor: firstPage.continueCursor,
    },
  });

  expect(firstPage.page).toHaveLength(10);
  expect(secondPage.page).toHaveLength(1);
  expect(secondPage.isDone).toBe(true);
  expect(
    [...firstPage.page, ...secondPage.page].some(
      (reward) => reward.id === rewardIds[0],
    ),
  ).toBe(false);
});

test("redeemed rewards are ordered by redemption time instead of creation time", async () => {
  const t = convexTest(schema, modules);
  const owner = withIdentity(t, "owner");
  await insertUser(t, "owner", 0);
  const olderGoalId = await owner.mutation(api.rewards.create, {
    name: "Older goal",
    cost: 100,
  });
  const newerGoalId = await owner.mutation(api.rewards.create, {
    name: "Newer goal",
    cost: 100,
  });

  await t.run(async (ctx) => {
    await ctx.db.patch(olderGoalId, {
      status: "redeemed",
      redeemedAt: 200,
      redeemedLocalDate: "2026-10-10",
    });
    await ctx.db.patch(newerGoalId, {
      status: "redeemed",
      redeemedAt: 100,
      redeemedLocalDate: "2026-10-09",
    });
  });

  const redeemed = await listRedeemedRewards(t, "owner");
  expect(redeemed.page.map(({ id }) => id)).toEqual([olderGoalId, newerGoalId]);
});

test("redemption atomically deducts the current cost and records the saved-timezone date and name", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-11T06:45:00.000Z"));
  try {
    const t = convexTest(schema, modules);
    const owner = withIdentity(t, "owner");
    await insertUser(t, "owner", 250);
    await t.run(async (ctx) => {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", "owner"))
        .unique();
      if (!user) {
        throw new Error("User not found");
      }
      await ctx.db.patch(user._id, { timezone: "America/Los_Angeles" });
    });
    const rewardId = await owner.mutation(api.rewards.create, {
      name: "Quiet Saturday",
      cost: 180,
    });
    await owner.mutation(api.rewards.update, {
      rewardId,
      name: "  Cabin weekend ",
      cost: 175,
    });

    await owner.mutation(api.rewards.redeem, { rewardId });

    await expect(owner.query(api.users.get, {})).resolves.toMatchObject({
      pointsBalance: 75,
    });
    await expect(listRewards(t, "owner")).resolves.toMatchObject({
      page: [],
      pointsBalance: 75,
    });
    await expect(listRedeemedRewards(t, "owner")).resolves.toMatchObject({
      page: [
        {
          id: rewardId,
          name: "Cabin weekend",
          cost: 175,
          redeemedAt: new Date("2026-10-11T06:45:00.000Z").getTime(),
          redeemedLocalDate: "2026-10-10",
        },
      ],
    });
    await expect(
      owner.mutation(api.rewards.update, {
        rewardId,
        name: "Changed after redemption",
        cost: 1,
      }),
    ).rejects.toThrow("Reward is not active");
    await expect(
      owner.mutation(api.rewards.deleteReward, { rewardId }),
    ).rejects.toThrow("Reward is not active");
    await expect(
      owner.mutation(api.rewards.redeem, { rewardId }),
    ).rejects.toThrow("Reward is not active");

    const transactions = await t.run(async (ctx) => {
      return await ctx.db
        .query("pointTransactions")
        .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", "owner"))
        .collect();
    });
    expect(transactions).toMatchObject([
      {
        amount: -175,
        sourceType: "reward_redemption",
        sourceName: "Cabin weekend",
        localDate: "2026-10-10",
        idempotencyKey: `redemption:${rewardId}`,
      },
    ]);
    await expect(owner.query(api.users.get, {})).resolves.toMatchObject({
      pointsBalance: 75,
    });
  } finally {
    vi.useRealTimers();
  }
});

test("insufficient balance leaves an active reward, balance, and ledger untouched", async () => {
  const t = convexTest(schema, modules);
  const owner = withIdentity(t, "owner");
  await insertUser(t, "owner", 179);
  const rewardId = await owner.mutation(api.rewards.create, {
    name: "Cabin weekend",
    cost: 180,
  });

  await expect(
    owner.mutation(api.rewards.redeem, { rewardId }),
  ).rejects.toThrow("Not enough points to redeem this reward");

  await expect(owner.query(api.users.get, {})).resolves.toMatchObject({
    pointsBalance: 179,
  });
  await expect(listRewards(t, "owner")).resolves.toMatchObject({
    page: [{ id: rewardId, name: "Cabin weekend", cost: 180 }],
  });
  await expect(listRedeemedRewards(t, "owner")).resolves.toMatchObject({
    page: [],
  });
  const transactions = await t.run(async (ctx) => {
    return await ctx.db
      .query("pointTransactions")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", "owner"))
      .collect();
  });
  expect(transactions).toEqual([]);
});

test("only the owning user can redeem and read a reward", async () => {
  const t = convexTest(schema, modules);
  const owner = withIdentity(t, "owner");
  const otherUser = withIdentity(t, "other-user");
  await insertUser(t, "owner", 200);
  await insertUser(t, "other-user", 200);
  const rewardId = await owner.mutation(api.rewards.create, {
    name: "A concert",
    cost: 100,
  });

  await expect(
    otherUser.mutation(api.rewards.redeem, { rewardId }),
  ).rejects.toThrow("Reward not found");
  await expect(owner.query(api.users.get, {})).resolves.toMatchObject({
    pointsBalance: 200,
  });
  await expect(listRewards(t, "owner")).resolves.toMatchObject({
    page: [{ id: rewardId }],
  });

  await owner.mutation(api.rewards.redeem, { rewardId });

  await expect(listRedeemedRewards(t, "other-user")).resolves.toMatchObject({
    page: [],
  });
  await expect(listRedeemedRewards(t, "owner")).resolves.toMatchObject({
    page: [{ id: rewardId }],
  });
});

test("concurrent confirmations cannot overspend a shared balance", async () => {
  const t = convexTest(schema, modules);
  const owner = withIdentity(t, "owner");
  await insertUser(t, "owner", 100);
  const firstRewardId = await owner.mutation(api.rewards.create, {
    name: "First goal",
    cost: 80,
  });
  const secondRewardId = await owner.mutation(api.rewards.create, {
    name: "Second goal",
    cost: 80,
  });

  const outcomes = await Promise.allSettled([
    owner.mutation(api.rewards.redeem, { rewardId: firstRewardId }),
    owner.mutation(api.rewards.redeem, { rewardId: secondRewardId }),
  ]);

  expect(outcomes.filter(({ status }) => status === "fulfilled")).toHaveLength(
    1,
  );
  expect(outcomes.filter(({ status }) => status === "rejected")).toHaveLength(
    1,
  );
  await expect(owner.query(api.users.get, {})).resolves.toMatchObject({
    pointsBalance: 20,
  });
  const transactions = await t.run(async (ctx) => {
    return await ctx.db
      .query("pointTransactions")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", "owner"))
      .collect();
  });
  expect(transactions).toHaveLength(1);
  expect(transactions[0]?.amount).toBe(-80);
});

test("concurrent confirmations for one reward create a single redemption", async () => {
  const t = convexTest(schema, modules);
  const owner = withIdentity(t, "owner");
  await insertUser(t, "owner", 100);
  const rewardId = await owner.mutation(api.rewards.create, {
    name: "One-time treat",
    cost: 80,
  });

  const outcomes = await Promise.allSettled([
    owner.mutation(api.rewards.redeem, { rewardId }),
    owner.mutation(api.rewards.redeem, { rewardId }),
  ]);

  expect(outcomes.filter(({ status }) => status === "fulfilled")).toHaveLength(
    1,
  );
  expect(outcomes.filter(({ status }) => status === "rejected")).toHaveLength(
    1,
  );
  await expect(owner.query(api.users.get, {})).resolves.toMatchObject({
    pointsBalance: 20,
  });
  await expect(listRedeemedRewards(t, "owner")).resolves.toMatchObject({
    page: [{ id: rewardId, name: "One-time treat", cost: 80 }],
  });
  const transactions = await t.run(async (ctx) => {
    return await ctx.db
      .query("pointTransactions")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", "owner"))
      .collect();
  });
  expect(transactions).toHaveLength(1);
  expect(transactions[0]?.amount).toBe(-80);
});

test("deleting an active reward leaves the spendable balance unchanged", async () => {
  const t = convexTest(schema, modules);
  const owner = withIdentity(t, "owner");
  await insertUser(t, "owner", 625);
  const rewardId = await owner.mutation(api.rewards.create, {
    name: "New book",
    cost: 280,
  });

  await owner.mutation(api.rewards.deleteReward, { rewardId });

  await expect(owner.query(api.users.get, {})).resolves.toMatchObject({
    pointsBalance: 625,
  });
  await expect(listRewards(t, "owner")).resolves.toMatchObject({
    page: [],
    pointsBalance: 625,
  });
});

test("Rewards visibility defaults on and can be hidden without deleting balance or reward data", async () => {
  const t = convexTest(schema, modules);
  const owner = withIdentity(t, "owner");
  await insertUser(t, "owner", 415);
  await owner.mutation(api.rewards.create, {
    name: "A slow morning",
    cost: 500,
  });

  await expect(owner.query(api.users.get, {})).resolves.toMatchObject({
    rewardsVisible: true,
  });

  await owner.mutation(api.users.setRewardsVisible, { visible: false });

  await expect(owner.query(api.users.get, {})).resolves.toMatchObject({
    rewardsVisible: false,
    pointsBalance: 415,
  });
  await expect(listRewards(t, "owner")).resolves.toMatchObject({
    page: [{ name: "A slow morning", cost: 500 }],
    pointsBalance: 415,
  });
});

test("redeemed rewards cannot be edited or deleted", async () => {
  const t = convexTest(schema, modules);
  const owner = withIdentity(t, "owner");
  await insertUser(t, "owner", 100);
  const rewardId = await owner.mutation(api.rewards.create, {
    name: "Coffee grinder",
    cost: 100,
  });
  await t.run(async (ctx) => {
    await ctx.db.patch(rewardId, {
      status: "redeemed",
      redeemedAt: 1_798_000_000_000,
      redeemedLocalDate: "2026-10-10",
    });
  });

  await expect(
    owner.mutation(api.rewards.update, {
      rewardId,
      name: "Another grinder",
      cost: 90,
    }),
  ).rejects.toThrow("Reward is not active");
  await expect(
    owner.mutation(api.rewards.deleteReward, { rewardId }),
  ).rejects.toThrow("Reward is not active");
});
