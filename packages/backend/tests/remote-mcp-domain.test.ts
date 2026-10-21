/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { afterEach, expect, test, vi } from "vitest";
import { api, internal } from "../convex/_generated/api";
import schema from "../convex/schema";

const modules = import.meta.glob("../convex/**/*.ts");

const withIdentity = (t: ReturnType<typeof convexTest>, subject: string) => {
  return t.withIdentity({ subject, tokenIdentifier: subject });
};

const insertUserAndHabits = async (
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
      pointsBalance: 0,
    });
    await ctx.db.insert("habits", {
      clerkUserId,
      habitKey: "walk",
      name: "Walk",
      glyph: "symbol:walk",
      category: "body",
      pointValue: 10,
      order: 0,
    });
    await ctx.db.insert("habits", {
      clerkUserId,
      habitKey: "read",
      name: "Read",
      glyph: "symbol:book",
      category: "learn",
      pointValue: 20,
      order: 1,
    });
  });
};

afterEach(() => {
  vi.useRealTimers();
});

test("remote ritual writes reuse selection, commit, completion, and points rules", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-09T12:00:00.000Z"));
  const t = convexTest(schema, modules);
  const owner = withIdentity(t, "owner");
  await insertUserAndHabits(t, "owner");

  await t.mutation(internal.day.startRevealForRemoteMcp, {
    clerkUserId: "owner",
    localDate: "2026-10-09",
  });
  await t.mutation(internal.day.setSelectionForRemoteMcp, {
    clerkUserId: "owner",
    localDate: "2026-10-09",
    habitId: "walk",
    selected: true,
  });
  await t.mutation(internal.day.startRevealForRemoteMcp, {
    clerkUserId: "owner",
    localDate: "2026-10-09",
  });
  await expect(
    t.query(internal.day.getForRemoteMcp, { clerkUserId: "owner" }),
  ).resolves.toMatchObject({
    phase: "reveal",
    selectedHabits: [{ id: "walk" }],
  });
  await t.mutation(internal.day.commitForRemoteMcp, {
    clerkUserId: "owner",
    clientId: "test-client",
    requestId: "commit-2026-10-09",
    localDate: "2026-10-09",
  });
  await t.run(async (ctx) => {
    const habit = await ctx.db
      .query("habits")
      .withIndex("by_clerkUserId_habitKey", (q) =>
        q.eq("clerkUserId", "owner").eq("habitKey", "walk"),
      )
      .unique();
    expect(habit).not.toBeNull();
    await ctx.db.patch(habit!._id, { pointValue: 40 });
  });
  await t.mutation(internal.day.startRevealForRemoteMcp, {
    clerkUserId: "owner",
    localDate: "2026-10-09",
  });
  await t.mutation(internal.day.setCompleteForRemoteMcp, {
    clerkUserId: "owner",
    localDate: "2026-10-09",
    habitId: "walk",
    completed: true,
  });

  await expect(
    t.query(internal.day.getForRemoteMcp, { clerkUserId: "owner" }),
  ).resolves.toMatchObject({
    phase: "complete",
    committedHabits: [{ id: "walk", name: "Walk", pointValue: 10 }],
    completedHabitIds: ["walk"],
    complete: true,
  });
  await expect(owner.query(api.users.get, {})).resolves.toMatchObject({
    pointsBalance: 30,
    streak: 1,
    daysCompleted: 1,
  });
});

test("remote habit addition waits for a later reveal and removal scrubs today's session", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-09T12:00:00.000Z"));
  const t = convexTest(schema, modules);
  await insertUserAndHabits(t, "owner");

  await t.mutation(internal.day.startRevealForRemoteMcp, {
    clerkUserId: "owner",
    localDate: "2026-10-09",
  });
  await t.mutation(internal.day.setSelectionForRemoteMcp, {
    clerkUserId: "owner",
    localDate: "2026-10-09",
    habitId: "walk",
    selected: true,
  });
  await t.mutation(internal.day.commitForRemoteMcp, {
    clerkUserId: "owner",
    clientId: "test-client",
    requestId: "commit-2026-10-09",
    localDate: "2026-10-09",
  });
  await t.mutation(internal.habits.addForRemoteMcp, {
    clerkUserId: "owner",
    habitKey: "new-habit",
    name: "Stretch",
    glyph: "symbol:stretch",
    category: "body",
  });
  const currentDay = await t.query(internal.day.getForRemoteMcp, {
    clerkUserId: "owner",
  });
  expect(currentDay.offeredHabits.map((habit) => habit.id)).not.toContain(
    "new-habit",
  );
  expect(currentDay.committedHabits.map((habit) => habit.id)).toEqual(["walk"]);
  await t.mutation(internal.habits.removeForRemoteMcp, {
    clerkUserId: "owner",
    localDate: "2026-10-09",
    habitKey: "walk",
  });

  await expect(
    t.query(internal.habits.listForRemoteMcp, { clerkUserId: "owner" }),
  ).resolves.toMatchObject([
    { id: "read" },
    { id: "new-habit", name: "Stretch" },
  ]);
  await expect(
    t.query(internal.day.getForRemoteMcp, { clerkUserId: "owner" }),
  ).resolves.toMatchObject({
    phase: "idle",
    committedHabits: [],
    completedHabitIds: [],
  });
  vi.setSystemTime(new Date("2026-10-10T12:00:00.000Z"));
  await t.mutation(internal.day.startRevealForRemoteMcp, {
    clerkUserId: "owner",
    localDate: "2026-10-10",
  });
  const nextDay = await t.query(internal.day.getForRemoteMcp, {
    clerkUserId: "owner",
  });
  expect(nextDay).toMatchObject({
    localDate: "2026-10-10",
    phase: "reveal",
  });
  expect(nextDay.offeredHabits).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: "read" }),
      expect.objectContaining({ id: "new-habit", name: "Stretch" }),
    ]),
  );
});

test("remote committed habit snapshots preserve categories and omit unknown legacy categories", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-09T12:00:00.000Z"));
  const t = convexTest(schema, modules);
  await insertUserAndHabits(t, "owner");
  await t.mutation(internal.day.startRevealForRemoteMcp, {
    clerkUserId: "owner",
    localDate: "2026-10-09",
  });
  await t.mutation(internal.day.setSelectionForRemoteMcp, {
    clerkUserId: "owner",
    localDate: "2026-10-09",
    habitId: "walk",
    selected: true,
  });
  await t.mutation(internal.day.commitForRemoteMcp, {
    clerkUserId: "owner",
    clientId: "test-client",
    requestId: "commit-2026-10-09",
    localDate: "2026-10-09",
  });
  await t.mutation(internal.day.setCompleteForRemoteMcp, {
    clerkUserId: "owner",
    localDate: "2026-10-09",
    habitId: "walk",
    completed: true,
  });
  await t.mutation(internal.habits.removeForRemoteMcp, {
    clerkUserId: "owner",
    localDate: "2026-10-09",
    habitKey: "walk",
  });

  const day = await t.query(internal.day.getForRemoteMcp, {
    clerkUserId: "owner",
  });
  expect(day.committedHabits).toMatchObject([
    { id: "walk", name: "Walk", category: "body", pointValue: 10 },
  ]);

  await t.run(async (ctx) => {
    await ctx.db.insert("users", {
      clerkUserId: "legacy-owner",
      capacity: 2,
      timezone: "UTC",
      streak: 0,
      daysCompleted: 1,
      lastCompletedLocalDate: "2026-10-09",
      pointsBalance: 20,
    });
    await ctx.db.insert("daySessions", {
      clerkUserId: "legacy-owner",
      localDate: "2026-10-09",
      phase: "complete",
      offeredIds: [],
      selectedIds: [],
      committedIds: ["legacy-habit"],
      completedIds: ["legacy-habit"],
      committedHabitSnapshots: [
        { habitId: "legacy-habit", name: "Legacy habit", glyph: "G" },
      ],
    });
  });

  const legacyDay = await t.query(internal.day.getForRemoteMcp, {
    clerkUserId: "legacy-owner",
  });
  expect(legacyDay.committedHabits[0]).toMatchObject({
    id: "legacy-habit",
    name: "Legacy habit",
  });
  expect(legacyDay.committedHabits[0]).not.toHaveProperty("category");
});

test("connected agent grants remain independent and preserve retryable revocations", async () => {
  const t = convexTest(schema, modules);
  const owner = withIdentity(t, "owner");
  const otherUser = withIdentity(t, "other-user");
  const connectionId = await t.mutation(internal.remoteMcp.authorizeToken, {
    clerkUserId: "owner",
    clientId: "https://agent.example/metadata.json",
    clientName: "Example agent",
    oauthApplicationId: "oauthapp_internal_example",
    scopes: ["orbii:read", "orbii:write", "profile"],
    tokenFingerprint: "fingerprint-1",
    encryptedAccessToken: "v1.iv.ciphertext",
    now: 1_800_000_000_000,
  });

  if (connectionId === null) {
    throw new Error("Expected the first OAuth grant to be authorized");
  }

  await expect(
    owner.query(api.remoteMcp.listConnections, {}),
  ).resolves.toMatchObject([
    {
      clientName: "Example agent",
      scopes: ["orbii:read", "orbii:write"],
    },
  ]);
  await expect(
    otherUser.query(api.remoteMcp.listConnections, {}),
  ).resolves.toEqual([]);

  const secondConnectionId = await t.mutation(
    internal.remoteMcp.authorizeToken,
    {
      clerkUserId: "owner",
      clientId: "https://agent.example/metadata.json",
      clientName: "Example agent",
      oauthApplicationId: "oauthapp_internal_example",
      scopes: ["orbii:read"],
      tokenFingerprint: "fingerprint-2",
      encryptedAccessToken: "v1.iv.new-ciphertext",
      now: 1_800_000_050_000,
    },
  );

  if (secondConnectionId === null) {
    throw new Error("Expected the second OAuth grant to be authorized");
  }

  expect(secondConnectionId).not.toBe(connectionId);
  await expect(
    owner.query(api.remoteMcp.listConnections, {}),
  ).resolves.toMatchObject([
    { _id: secondConnectionId, scopes: ["orbii:read"] },
    { _id: connectionId, scopes: ["orbii:read", "orbii:write"] },
  ]);

  await t.mutation(internal.remoteMcp.markConnectionRevoked, {
    clerkUserId: "owner",
    connectionId,
    revokedAt: 1_800_000_100_000,
  });

  await expect(
    owner.query(api.remoteMcp.listConnections, {}),
  ).resolves.toMatchObject([
    { _id: secondConnectionId, revocationPending: false },
    { _id: connectionId, revocationPending: true },
  ]);
  await expect(
    t.mutation(internal.remoteMcp.authorizeToken, {
      clerkUserId: "owner",
      clientId: "https://agent.example/metadata.json",
      clientName: "Example agent",
      oauthApplicationId: "oauthapp_internal_example",
      scopes: ["orbii:read"],
      tokenFingerprint: "fingerprint-3",
      encryptedAccessToken: "v1.iv.third-ciphertext",
      now: 1_800_000_200_000,
    }),
  ).resolves.toBeNull();

  await t.mutation(internal.remoteMcp.finishConnectionRevocation, {
    clerkUserId: "owner",
    connectionId,
  });

  await expect(
    owner.query(api.remoteMcp.listConnections, {}),
  ).resolves.toMatchObject([{ _id: secondConnectionId }]);
  await t.run(async (ctx) => {
    const revokedConnection = await ctx.db
      .query("agentConnections")
      .withIndex("by_clerkUserId_tokenFingerprint", (q) =>
        q.eq("clerkUserId", "owner").eq("tokenFingerprint", "fingerprint-1"),
      )
      .unique();
    const activeConnection = await ctx.db
      .query("agentConnections")
      .withIndex("by_clerkUserId_tokenFingerprint", (q) =>
        q.eq("clerkUserId", "owner").eq("tokenFingerprint", "fingerprint-2"),
      )
      .unique();
    expect(revokedConnection?.encryptedAccessToken).toBe("");
    expect(revokedConnection?.revokedAt).toBe(1_800_000_100_000);
    expect(revokedConnection?.revocationPending).toBe(false);
    expect(activeConnection?.encryptedAccessToken).toBe("v1.iv.new-ciphertext");
    expect(activeConnection?.revokedAt).toBeUndefined();
  });
});
