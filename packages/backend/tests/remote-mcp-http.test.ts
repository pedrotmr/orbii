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

test("MCP stores Clerk's application ID separately from the public client ID", async () => {
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
          client_name: "Example agent",
          scopes: ["orbii:read"],
        }),
        { status: 200 },
      ),
    )
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: [{ id: "oauthapp_internal_1", client_id: "client_public_1" }],
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
          client_name: "Example agent",
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
    oauthApplicationId: "oauthapp_internal_1",
  });
});
