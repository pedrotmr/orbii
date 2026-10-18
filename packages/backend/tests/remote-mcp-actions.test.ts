/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { afterEach, expect, test, vi } from "vitest";
import { api, internal } from "../convex/_generated/api";
import { encryptOAuthToken } from "../convex/lib/remote-mcp-auth";
import schema from "../convex/schema";

const modules = import.meta.glob("../convex/**/*.ts");
const clerkSecretKey = "sk_test_clerk_backend";
const encryptionKey = btoa(String.fromCharCode(...new Uint8Array(32).fill(37)))
  .replaceAll("+", "-")
  .replaceAll("/", "_")
  .replace(/=+$/, "");
const accessToken = "oat_remote_mcp_test";

const withIdentity = (t: ReturnType<typeof convexTest>, subject: string) => {
  return t.withIdentity({ subject, tokenIdentifier: subject });
};

const insertConnection = async (t: ReturnType<typeof convexTest>) => {
  const connectionId = await t.mutation(internal.remoteMcp.authorizeToken, {
    clerkUserId: "owner",
    clientId: "client_public_1",
    clientName: "Example agent",
    oauthApplicationId: "oauthapp_internal_1",
    scopes: ["orbii:read"],
    tokenFingerprint: "fingerprint-1",
    encryptedAccessToken: await encryptOAuthToken(accessToken, encryptionKey),
    now: 1_800_000_000_000,
  });

  if (connectionId === null) {
    throw new Error("Expected the OAuth token to be authorized");
  }

  return connectionId;
};

const storedConnection = async (t: ReturnType<typeof convexTest>) => {
  return await t.run(async (ctx) => {
    const connections = await ctx.db.query("agentConnections").collect();
    return connections.find(
      (connection) =>
        connection.clerkUserId === "owner" &&
        connection.tokenFingerprint === "fingerprint-1",
    );
  });
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

test("connection revocation uses Clerk's internal application ID and erases the token after success", async () => {
  vi.stubEnv("CLERK_SECRET_KEY", clerkSecretKey);
  vi.stubEnv("MCP_CREDENTIAL_ENCRYPTION_KEY", encryptionKey);
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetcher);

  const t = convexTest(schema, modules);
  const owner = withIdentity(t, "owner");
  const connectionId = await insertConnection(t);

  await expect(
    owner.action(api.remoteMcpActions.revokeConnection, { connectionId }),
  ).resolves.toEqual({ revoked: true, providerRevoked: true });

  expect(String(fetcher.mock.calls[0]?.[0])).toBe(
    "https://api.clerk.com/v1/oauth_applications/oauthapp_internal_1/revoke_token",
  );
  expect(fetcher.mock.calls[0]?.[1]).toMatchObject({
    method: "POST",
    body: JSON.stringify({ token: accessToken }),
  });
  await expect(owner.query(api.remoteMcp.listConnections, {})).resolves.toEqual(
    [],
  );
  await expect(storedConnection(t)).resolves.toMatchObject({
    encryptedAccessToken: "",
    revocationPending: false,
  });
});

test.each([400, 404, 503])(
  "failed provider revocation with status %i keeps credentials encrypted and retryable",
  async (status) => {
    vi.stubEnv("CLERK_SECRET_KEY", clerkSecretKey);
    vi.stubEnv("MCP_CREDENTIAL_ENCRYPTION_KEY", encryptionKey);
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("{}", { status }));
    vi.stubGlobal("fetch", fetcher);

    const t = convexTest(schema, modules);
    const owner = withIdentity(t, "owner");
    const connectionId = await insertConnection(t);

    await expect(
      owner.action(api.remoteMcpActions.revokeConnection, { connectionId }),
    ).resolves.toEqual({ revoked: true, providerRevoked: false });
    await expect(
      owner.query(api.remoteMcp.listConnections, {}),
    ).resolves.toMatchObject([{ _id: connectionId, revocationPending: true }]);
    await expect(storedConnection(t)).resolves.toMatchObject({
      encryptedAccessToken: expect.stringMatching(/^v1\./),
      revocationPending: true,
    });
  },
);
