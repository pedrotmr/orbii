/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { afterEach, expect, test, vi } from "vitest";
import schema from "../convex/schema";

const modules = import.meta.glob("../convex/**/*.ts");
const encryptionKey = btoa(String.fromCharCode(...new Uint8Array(32).fill(43)))
  .replaceAll("+", "-")
  .replaceAll("/", "_")
  .replace(/=+$/, "");

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

test("MCP endpoint rejects an unsupported protocol version and accepts the legacy missing header", async () => {
  const t = convexTest(schema, modules);
  const unsupported = await t.fetch("/mcp", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Mcp-Protocol-Version": "2026-01-01",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }),
  });
  const missingVersion = await t.fetch("/mcp", {
    method: "POST",
    headers: { Accept: "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }),
  });

  expect(unsupported.status).toBe(400);
  await expect(unsupported.json()).resolves.toMatchObject({
    error: "Unsupported MCP protocol version",
  });
  expect(missingVersion.status).toBe(401);
});

test("MCP endpoint reports Clerk verification outages as retryable service errors", async () => {
  vi.stubEnv("CLERK_JWT_ISSUER_DOMAIN", "https://orbii.clerk.accounts.dev");
  vi.stubEnv("CLERK_SECRET_KEY", "sk_test_backend");
  vi.stubEnv("MCP_CREDENTIAL_ENCRYPTION_KEY", "test-encryption-key");
  vi.stubGlobal(
    "fetch",
    vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("{}", { status: 503 })),
  );
  const t = convexTest(schema, modules);
  const response = await t.fetch("/mcp", {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer opaque-token",
      "Mcp-Protocol-Version": "2025-11-25",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }),
  });

  expect(response.status).toBe(503);
  await expect(response.json()).resolves.toMatchObject({
    error: "temporarily_unavailable",
  });
});

test("MCP endpoint returns the negotiated version and uses the legacy header fallback", async () => {
  vi.stubEnv("CLERK_JWT_ISSUER_DOMAIN", "https://orbii.clerk.accounts.dev");
  vi.stubEnv("CLERK_SECRET_KEY", "sk_test_backend");
  vi.stubEnv("MCP_CREDENTIAL_ENCRYPTION_KEY", encryptionKey);
  vi.stubGlobal(
    "fetch",
    vi.fn<typeof fetch>(async (input) => {
      if (String(input).includes("/oauth_applications?")) {
        return new Response(
          JSON.stringify({
            data: [{ id: "oauthapp_internal_1", client_id: "client_public_1" }],
          }),
          { status: 200 },
        );
      }

      return new Response(
        JSON.stringify({
          subject: "user_orbii_1",
          client_id: "client_public_1",
          client_name: "Example agent",
          aud: "https://some.convex.site/mcp",
          scopes: ["orbii:read"],
        }),
        { status: 200 },
      );
    }),
  );
  const t = convexTest(schema, modules);
  const initialize = await t.fetch("/mcp", {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer opaque-token",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2025-06-18" },
    }),
  });
  const initializeBody = await initialize.json();
  const sessionId = initialize.headers.get("Mcp-Session-Id");

  if (!sessionId) {
    throw new Error("MCP initialize did not return a session ID");
  }

  const pingWithoutSession = await t.fetch("/mcp", {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer opaque-token",
      "Mcp-Protocol-Version": "2025-06-18",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 4, method: "ping" }),
  });
  const pingWithVersion = await t.fetch("/mcp", {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer opaque-token",
      "Mcp-Protocol-Version": "2025-06-18",
      "Mcp-Session-Id": sessionId,
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "ping" }),
  });
  const pingWithoutVersion = await t.fetch("/mcp", {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer opaque-token",
      "Mcp-Session-Id": sessionId,
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 3, method: "ping" }),
  });

  expect(initialize.status).toBe(200);
  expect(initialize.headers.get("Mcp-Protocol-Version")).toBe("2025-06-18");
  expect(initialize.headers.get("Access-Control-Expose-Headers")).toContain(
    "Mcp-Session-Id",
  );
  expect(initializeBody).toMatchObject({
    result: { protocolVersion: "2025-06-18" },
  });
  expect(pingWithoutSession.status).toBe(400);
  await expect(pingWithoutSession.json()).resolves.toMatchObject({
    error: "session_required",
  });
  expect(pingWithVersion.headers.get("Mcp-Protocol-Version")).toBe(
    "2025-06-18",
  );
  expect(pingWithoutVersion.headers.get("Mcp-Protocol-Version")).toBe(
    "2025-03-26",
  );
});

test("authorization-server metadata is exposed at the resource origin for older MCP clients", async () => {
  const issuer = "https://orbii.clerk.accounts.dev";
  vi.stubEnv("CLERK_JWT_ISSUER_DOMAIN", issuer);
  const metadata = {
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
  };
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValue(new Response(JSON.stringify(metadata), { status: 200 }));
  vi.stubGlobal("fetch", fetcher);
  const t = convexTest(schema, modules);

  const response = await t.fetch("/.well-known/oauth-authorization-server");

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(metadata);
  expect(String(fetcher.mock.calls[0]?.[0])).toBe(
    `${issuer}/.well-known/oauth-authorization-server`,
  );
  const preflight = await t.fetch("/.well-known/oauth-authorization-server", {
    method: "OPTIONS",
  });
  expect(preflight.status).toBe(204);
});

test("MCP stores Clerk's application ID and resolved name separately from the public client ID", async () => {
  vi.stubEnv("CLERK_JWT_ISSUER_DOMAIN", "https://orbii.clerk.accounts.dev");
  vi.stubEnv("CLERK_SECRET_KEY", "sk_test_backend");
  vi.stubEnv("MCP_CREDENTIAL_ENCRYPTION_KEY", encryptionKey);
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          subject: "user_orbii_1",
          client_id: "client_public_1",
          aud: "https://some.convex.site/mcp",
          scopes: ["orbii:read"],
        }),
        { status: 200 },
      ),
    )
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: [
            {
              id: "oauthapp_internal_1",
              client_id: "client_public_1",
              name: "Example agent",
            },
          ],
          total_count: 1,
        }),
        { status: 200 },
      ),
    )
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          subject: "user_orbii_1",
          client_id: "client_public_1",
          aud: "https://some.convex.site/mcp",
          scopes: ["orbii:read"],
        }),
        { status: 200 },
      ),
    );
  vi.stubGlobal("fetch", fetcher);
  const t = convexTest(schema, modules);
  const request = {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer opaque-token",
      "Mcp-Protocol-Version": "2025-11-25",
      "Mcp-Session-Id": "name-less-app-session",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }),
  };

  await expect(t.fetch("/mcp", request)).resolves.toMatchObject({
    status: 200,
  });
  await expect(t.fetch("/mcp", request)).resolves.toMatchObject({
    status: 200,
  });
  expect(fetcher).toHaveBeenCalledTimes(3);
  expect(String(fetcher.mock.calls[1]?.[0])).toBe(
    "https://api.clerk.com/v1/oauth_applications?limit=500&offset=0",
  );
  await expect(
    t.run(async (ctx) => {
      const connections = await ctx.db.query("agentConnections").collect();
      return connections[0];
    }),
  ).resolves.toMatchObject({
    clientId: "client_public_1",
    clientName: "Example agent",
    oauthApplicationId: "oauthapp_internal_1",
  });
});

test("write-only grants scope retries to sessions and support legacy batches", async () => {
  vi.stubEnv("CLERK_JWT_ISSUER_DOMAIN", "https://orbii.clerk.accounts.dev");
  vi.stubEnv("CLERK_SECRET_KEY", "sk_test_backend");
  vi.stubEnv("MCP_CREDENTIAL_ENCRYPTION_KEY", encryptionKey);
  const fetcher = vi.fn<typeof fetch>(async (input) => {
    if (String(input).includes("/oauth_applications?")) {
      return new Response(
        JSON.stringify({
          data: [{ id: "oauthapp_internal_1", client_id: "client_public_1" }],
        }),
        { status: 200 },
      );
    }

    return new Response(
      JSON.stringify({
        subject: "user_orbii_1",
        client_id: "client_public_1",
        aud: "https://some.convex.site/mcp",
        scopes: ["orbii:write"],
      }),
      { status: 200 },
    );
  });
  vi.stubGlobal("fetch", fetcher);
  const t = convexTest(schema, modules);
  await t.run(async (ctx) => {
    await ctx.db.insert("users", {
      clerkUserId: "user_orbii_1",
      capacity: 2,
      timezone: "UTC",
      streak: 0,
      daysCompleted: 0,
      lastCompletedLocalDate: null,
      pointsBalance: 0,
    });
  });

  const addHabitRequest = (name: string, category: string) =>
    JSON.stringify({
      jsonrpc: "2.0",
      id: "add-habit-retry-1",
      method: "tools/call",
      params: {
        name: "add_habit",
        arguments: {
          name,
          glyph: "symbol:stretch",
          category,
        },
      },
    });
  const call = (
    body: string,
    sessionId = "session-1",
    protocolVersion = "2025-11-25",
  ) =>
    t.fetch("/mcp", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer opaque-token",
        "Mcp-Protocol-Version": protocolVersion,
        "Mcp-Session-Id": sessionId,
      },
      body,
    });
  const first = await call(addHabitRequest("Stretch", "body"));
  const retry = await call(addHabitRequest("Stretch", "body"));
  const firstBody = await first.json();
  const retryBody = await retry.json();

  expect(first.status).toBe(200);
  expect(retry.status).toBe(200);
  expect(firstBody).toMatchObject({
    result: {
      content: [{ type: "text", text: JSON.stringify({ ok: true }) }],
      isError: false,
    },
  });
  expect(retryBody).toEqual(firstBody);
  const reusedIdInSameSession = await call(addHabitRequest("Meditate", "mind"));
  await expect(reusedIdInSameSession.json()).resolves.toMatchObject({
    result: {
      isError: true,
      content: [{ text: expect.stringContaining("request ID was reused") }],
    },
  });

  const newSession = await call(addHabitRequest("Read", "learn"), "session-2");
  const newSessionBody = await newSession.json();
  const newSessionRetry = await call(
    addHabitRequest("Read", "learn"),
    "session-2",
  );
  await expect(newSessionRetry.json()).resolves.toEqual(newSessionBody);

  const batch = await call(
    JSON.stringify([
      { jsonrpc: "2.0", id: 10, method: "ping" },
      { jsonrpc: "2.0", id: 11, method: "ping" },
    ]),
    "session-1",
    "2025-03-26",
  );
  expect(batch.status).toBe(200);
  await expect(batch.json()).resolves.toEqual([
    { jsonrpc: "2.0", id: 10, result: {} },
    { jsonrpc: "2.0", id: 11, result: {} },
  ]);
  expect(
    fetcher.mock.calls.filter(([input]) =>
      String(input).includes("/oauth_applications?"),
    ),
  ).toHaveLength(1);

  const deniedRead = await call(
    JSON.stringify({
      jsonrpc: "2.0",
      id: "read-write-only",
      method: "tools/call",
      params: { name: "get_orbit", arguments: {} },
    }),
  );
  expect(deniedRead.status).toBe(403);

  const deniedReadBatch = await call(
    JSON.stringify([
      {
        jsonrpc: "2.0",
        id: "read-write-only-batch",
        method: "tools/call",
        params: { name: "get_orbit", arguments: {} },
      },
    ]),
    "session-1",
    "2025-03-26",
  );
  expect(deniedReadBatch.status).toBe(403);
  expect(deniedReadBatch.headers.get("WWW-Authenticate")).toContain(
    'scope="orbii:read"',
  );
  await expect(deniedReadBatch.json()).resolves.toMatchObject([
    {
      jsonrpc: "2.0",
      id: "read-write-only-batch",
      error: { code: -32003, data: { requiredScope: "orbii:read" } },
    },
  ]);

  const stored = await t.run(async (ctx) => ({
    habits: await ctx.db.query("habits").collect(),
    requests: await ctx.db.query("remoteMcpHabitRequests").collect(),
  }));
  expect(stored.habits.map((habit) => habit.name).sort()).toEqual([
    "Read",
    "Stretch",
  ]);
  expect(stored.requests.map((request) => request.name).sort()).toEqual([
    "Read",
    "Stretch",
  ]);
});

test("MCP deduplicates commit retries within a session", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-18T12:00:00.000Z"));
  vi.stubEnv("CLERK_JWT_ISSUER_DOMAIN", "https://orbii.clerk.accounts.dev");
  vi.stubEnv("CLERK_SECRET_KEY", "sk_test_backend");
  vi.stubEnv("MCP_CREDENTIAL_ENCRYPTION_KEY", encryptionKey);
  vi.stubGlobal(
    "fetch",
    vi.fn<typeof fetch>(async (input) => {
      if (String(input).includes("/oauth_applications?")) {
        return new Response(
          JSON.stringify({
            data: [{ id: "oauthapp_internal_1", client_id: "client_public_1" }],
          }),
          { status: 200 },
        );
      }

      return new Response(
        JSON.stringify({
          subject: "user_orbii_1",
          client_id: "client_public_1",
          aud: "https://some.convex.site/mcp",
          scopes: ["orbii:write"],
        }),
        { status: 200 },
      );
    }),
  );
  const t = convexTest(schema, modules);
  await t.run(async (ctx) => {
    await ctx.db.insert("users", {
      clerkUserId: "user_orbii_1",
      capacity: 2,
      timezone: "UTC",
      streak: 0,
      daysCompleted: 0,
      lastCompletedLocalDate: null,
      pointsBalance: 0,
    });
    await ctx.db.insert("habits", {
      clerkUserId: "user_orbii_1",
      habitKey: "habit-1",
      name: "Walk",
      glyph: "symbol:walk",
      category: "body",
      order: 0,
    });
    await ctx.db.insert("daySessions", {
      clerkUserId: "user_orbii_1",
      localDate: "2026-10-18",
      phase: "reveal",
      offeredIds: ["habit-1"],
      selectedIds: ["habit-1"],
      committedIds: [],
      completedIds: [],
    });
  });

  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: "commit-retry-1",
    method: "tools/call",
    params: { name: "commit_today", arguments: {} },
  });
  const call = () =>
    t.fetch("/mcp", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer opaque-token",
        "Mcp-Protocol-Version": "2025-11-25",
        "Mcp-Session-Id": "commit-session",
      },
      body,
    });

  const first = await call();
  const firstBody = await first.json();
  const retry = await call();
  const retryBody = await retry.json();
  const stored = await t.run(async (ctx) => ({
    day: await ctx.db
      .query("daySessions")
      .withIndex("by_clerkUserId_localDate", (q) =>
        q.eq("clerkUserId", "user_orbii_1").eq("localDate", "2026-10-18"),
      )
      .unique(),
    requests: await ctx.db.query("remoteMcpCommitRequests").collect(),
  }));

  expect(first.status).toBe(200);
  expect(retry.status).toBe(200);
  expect(retryBody).toEqual(firstBody);
  expect(stored.day?.phase).toBe("active");
  expect(stored.day?.committedIds).toEqual(["habit-1"]);
  expect(stored.requests).toHaveLength(1);
});

test("MCP deduplicates re-reveal retries within a session", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-18T12:00:00.000Z"));
  vi.stubEnv("CLERK_JWT_ISSUER_DOMAIN", "https://orbii.clerk.accounts.dev");
  vi.stubEnv("CLERK_SECRET_KEY", "sk_test_backend");
  vi.stubEnv("MCP_CREDENTIAL_ENCRYPTION_KEY", encryptionKey);
  vi.stubGlobal(
    "fetch",
    vi.fn<typeof fetch>(async (input) => {
      if (String(input).includes("/oauth_applications?")) {
        return new Response(
          JSON.stringify({
            data: [{ id: "oauthapp_internal_1", client_id: "client_public_1" }],
          }),
          { status: 200 },
        );
      }

      return new Response(
        JSON.stringify({
          subject: "user_orbii_1",
          client_id: "client_public_1",
          aud: "https://some.convex.site/mcp",
          scopes: ["orbii:write"],
        }),
        { status: 200 },
      );
    }),
  );
  const t = convexTest(schema, modules);
  await t.run(async (ctx) => {
    await ctx.db.insert("users", {
      clerkUserId: "user_orbii_1",
      capacity: 2,
      timezone: "UTC",
      streak: 0,
      daysCompleted: 0,
      lastCompletedLocalDate: null,
      pointsBalance: 0,
    });
    const habitIds = Array.from({ length: 8 }, (_, index) => `habit-${index}`);
    for (const [index, habitKey] of habitIds.entries()) {
      await ctx.db.insert("habits", {
        clerkUserId: "user_orbii_1",
        habitKey,
        name: `Habit ${index}`,
        glyph: "symbol:spark",
        category: (["body", "mind", "learn", "life"] as const)[index % 4]!,
        order: index,
      });
    }
    await ctx.db.insert("daySessions", {
      clerkUserId: "user_orbii_1",
      localDate: "2026-10-18",
      phase: "reveal",
      offeredIds: habitIds.slice(0, 5),
      selectedIds: [],
      committedIds: [],
      completedIds: [],
    });
  });

  let randomCalls = 0;
  vi.spyOn(Math, "random").mockImplementation(() => {
    randomCalls += 1;
    return randomCalls <= 7 ? 0 : 0.99;
  });
  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: "rereveal-retry-1",
    method: "tools/call",
    params: { name: "rereveal_today", arguments: {} },
  });
  const call = (sessionId: string) =>
    t.fetch("/mcp", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer opaque-token",
        "Mcp-Protocol-Version": "2025-11-25",
        "Mcp-Session-Id": sessionId,
      },
      body,
    });

  const first = await call("rereveal-session");
  const firstBody = await first.json();
  const firstOffer = await t.run(async (ctx) => {
    const day = await ctx.db
      .query("daySessions")
      .withIndex("by_clerkUserId_localDate", (q) =>
        q.eq("clerkUserId", "user_orbii_1").eq("localDate", "2026-10-18"),
      )
      .unique();
    return day?.offeredIds;
  });
  const retry = await call("rereveal-session");
  const retryBody = await retry.json();
  const retryOffer = await t.run(async (ctx) => {
    const day = await ctx.db
      .query("daySessions")
      .withIndex("by_clerkUserId_localDate", (q) =>
        q.eq("clerkUserId", "user_orbii_1").eq("localDate", "2026-10-18"),
      )
      .unique();
    return day?.offeredIds;
  });

  expect(first.status).toBe(200);
  expect(retry.status).toBe(200);
  expect(retryBody).toEqual(firstBody);
  expect(retryOffer).toEqual(firstOffer);
  const newSession = await call("rereveal-session-2");
  expect(newSession.status).toBe(200);
  const newSessionOffer = await t.run(async (ctx) => {
    const day = await ctx.db
      .query("daySessions")
      .withIndex("by_clerkUserId_localDate", (q) =>
        q.eq("clerkUserId", "user_orbii_1").eq("localDate", "2026-10-18"),
      )
      .unique();
    return day?.offeredIds;
  });

  expect(newSessionOffer).not.toEqual(firstOffer);
  expect(randomCalls).toBeGreaterThan(7);
  await expect(
    t.run(async (ctx) => ctx.db.query("remoteMcpRerevealRequests").collect()),
  ).resolves.toHaveLength(2);
});

test("MCP reports credential encryption failures as retryable service errors", async () => {
  vi.stubEnv("CLERK_JWT_ISSUER_DOMAIN", "https://orbii.clerk.accounts.dev");
  vi.stubEnv("CLERK_SECRET_KEY", "sk_test_backend");
  vi.stubEnv("MCP_CREDENTIAL_ENCRYPTION_KEY", "not-a-valid-key");
  vi.stubGlobal(
    "fetch",
    vi.fn<typeof fetch>(async (input) => {
      if (String(input).includes("/oauth_applications?")) {
        return new Response(
          JSON.stringify({
            data: [{ id: "oauthapp_internal_1", client_id: "client_public_1" }],
          }),
          { status: 200 },
        );
      }

      return new Response(
        JSON.stringify({
          subject: "user_orbii_1",
          client_id: "client_public_1",
          aud: "https://some.convex.site/mcp",
          scopes: ["orbii:read"],
        }),
        { status: 200 },
      );
    }),
  );
  const t = convexTest(schema, modules);
  const response = await t.fetch("/mcp", {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer opaque-token",
      "Mcp-Protocol-Version": "2025-11-25",
      "Mcp-Session-Id": "session-1",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }),
  });

  expect(response.status).toBe(503);
  await expect(response.json()).resolves.toMatchObject({
    error: "temporarily_unavailable",
  });
});
