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
  const pingWithVersion = await t.fetch("/mcp", {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer opaque-token",
      "Mcp-Protocol-Version": "2025-06-18",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "ping" }),
  });
  const pingWithoutVersion = await t.fetch("/mcp", {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer opaque-token",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 3, method: "ping" }),
  });

  expect(initialize.status).toBe(200);
  expect(initialize.headers.get("Mcp-Protocol-Version")).toBe("2025-06-18");
  expect(initializeBody).toMatchObject({
    result: { protocolVersion: "2025-06-18" },
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

test("write-only grants return acknowledgements and deduplicate add retries", async () => {
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

  const addHabitRequest = JSON.stringify({
    jsonrpc: "2.0",
    id: "add-habit-retry-1",
    method: "tools/call",
    params: {
      name: "add_habit",
      arguments: {
        name: "Stretch",
        glyph: "symbol:stretch",
        category: "body",
      },
    },
  });
  const call = (body: string) =>
    t.fetch("/mcp", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer opaque-token",
        "Mcp-Protocol-Version": "2025-11-25",
      },
      body,
    });
  const first = await call(addHabitRequest);
  const retry = await call(addHabitRequest);
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
  expect(fetcher).toHaveBeenCalledTimes(3);

  const deniedRead = await call(
    JSON.stringify({
      jsonrpc: "2.0",
      id: "read-write-only",
      method: "tools/call",
      params: { name: "get_orbit", arguments: {} },
    }),
  );
  expect(deniedRead.status).toBe(403);

  await expect(
    t.run(async (ctx) => ({
      habits: await ctx.db.query("habits").collect(),
      requests: await ctx.db.query("remoteMcpHabitRequests").collect(),
    })),
  ).resolves.toMatchObject({
    habits: [{ clerkUserId: "user_orbii_1", name: "Stretch" }],
    requests: [{ clientId: "client_public_1", name: "Stretch" }],
  });
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
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }),
  });

  expect(response.status).toBe(503);
  await expect(response.json()).resolves.toMatchObject({
    error: "temporarily_unavailable",
  });
});
