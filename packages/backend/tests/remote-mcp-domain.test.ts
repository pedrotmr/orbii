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
    localDate: "2026-10-09",
  });
  await t.mutation(internal.habits.addForRemoteMcp, {
    clerkUserId: "owner",
    habitKey: "new-habit",
    name: "Stretch",
    glyph: "symbol:stretch",
    category: "body",
  });
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
  await expect(
    t.query(internal.day.getForRemoteMcp, { clerkUserId: "owner" }),
  ).resolves.toMatchObject({
    localDate: "2026-10-10",
    phase: "reveal",
    offeredHabits: [{ id: "read" }, { id: "new-habit", name: "Stretch" }],
  });
});

test("connected agents are private, block pending revocations, and erase credentials after Clerk confirms", async () => {
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

  await t.mutation(internal.remoteMcp.markConnectionRevoked, {
    clerkUserId: "owner",
    connectionId,
    revokedAt: 1_800_000_100_000,
  });

  await expect(
    owner.query(api.remoteMcp.listConnections, {}),
  ).resolves.toMatchObject([{ _id: connectionId, revocationPending: true }]);
  await expect(
    t.mutation(internal.remoteMcp.authorizeToken, {
      clerkUserId: "owner",
      clientId: "https://agent.example/metadata.json",
      clientName: "Example agent",
      oauthApplicationId: "oauthapp_internal_example",
      scopes: ["orbii:read"],
      tokenFingerprint: "fingerprint-2",
      encryptedAccessToken: "v1.iv.new-ciphertext",
      now: 1_800_000_200_000,
    }),
  ).rejects.toThrow("pending revocation");

  await t.mutation(internal.remoteMcp.finishConnectionRevocation, {
    clerkUserId: "owner",
    connectionId,
  });

  await expect(owner.query(api.remoteMcp.listConnections, {})).resolves.toEqual(
    [],
  );
  await t.run(async (ctx) => {
    const connection = await ctx.db
      .query("agentConnections")
      .withIndex("by_clerkUserId_tokenFingerprint", (q) =>
        q.eq("clerkUserId", "owner").eq("tokenFingerprint", "fingerprint-1"),
      )
      .unique();
    expect(connection?.encryptedAccessToken).toBe("");
    expect(connection?.revokedAt).toBe(1_800_000_100_000);
    expect(connection?.revocationPending).toBe(false);
  });
});
