import { expect, test, vi } from "vitest";
import {
  decryptOAuthToken,
  encryptOAuthToken,
  fingerprintOAuthToken,
  MCP_READ_SCOPE,
  MCP_WRITE_SCOPE,
  OAuthVerificationUnavailableError,
  parseVerifiedOAuthToken,
  verifyClerkOAuthToken,
} from "../convex/lib/remote-mcp-auth";
import {
  dispatchRemoteMcpMessage,
  supportsMcpProtocolVersion,
  type RemoteMcpTool,
} from "../convex/lib/remote-mcp-protocol";

const issuer = "https://orbii.clerk.accounts.dev";
const resource = "https://orbii.convex.site/mcp";

const testTools: RemoteMcpTool[] = [
  {
    name: "get_orbit",
    title: "Get Orbit",
    description: "Read the Orbit.",
    requiredScope: MCP_READ_SCOPE,
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "commit_today",
    title: "Commit today",
    description: "Commit today.",
    requiredScope: MCP_WRITE_SCOPE,
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
];

const tokenClaims = {
  subject: "user_orbii_1",
  client_id: "client_agent_1",
  client_name: "Example agent",
  aud: resource,
  oauth_application_id: "oauthapp_internal_1",
  scopes: [MCP_READ_SCOPE, MCP_WRITE_SCOPE],
};

test("verified Clerk access tokens must identify an Orbii user, client, and scope", () => {
  expect(parseVerifiedOAuthToken(tokenClaims, issuer, resource)).toEqual({
    userId: "user_orbii_1",
    clientId: "client_agent_1",
    clientName: "Example agent",
    scopes: [MCP_READ_SCOPE, MCP_WRITE_SCOPE],
  });

  expect(() =>
    parseVerifiedOAuthToken(
      { ...tokenClaims, iss: "https://another-clerk-instance.dev" },
      issuer,
      resource,
    ),
  ).toThrow("unexpected issuer");
  expect(() =>
    parseVerifiedOAuthToken(
      { ...tokenClaims, aud: "https://another-resource.example/mcp" },
      issuer,
      resource,
    ),
  ).toThrow("unexpected audience");
  expect(() =>
    parseVerifiedOAuthToken(
      { ...tokenClaims, aud: undefined },
      issuer,
      resource,
    ),
  ).toThrow("unexpected audience");
  expect(() =>
    parseVerifiedOAuthToken(
      { ...tokenClaims, expired: true },
      issuer,
      resource,
    ),
  ).toThrow("invalid");
  expect(() =>
    parseVerifiedOAuthToken(
      { ...tokenClaims, exp: Math.floor(Date.now() / 1000) - 1 },
      issuer,
      resource,
    ),
  ).toThrow("expired");
  expect(() =>
    parseVerifiedOAuthToken(
      {
        user_id: "user_orbii_1",
        client_id: "client_1",
        scope: "profile",
        aud: resource,
      },
      issuer,
      resource,
    ),
  ).toThrow("no Orbii MCP scopes");
});

test("Clerk verifies OAuth tokens with the Backend API before identity is used", async () => {
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValue(
      new Response(JSON.stringify(tokenClaims), { status: 200 }),
    );

  await expect(
    verifyClerkOAuthToken("opaque-token", {
      expectedIssuer: issuer,
      expectedResource: resource,
      secretKey: "sk_test_backend",
      fetcher,
    }),
  ).resolves.toMatchObject({ userId: "user_orbii_1" });

  expect(fetcher).toHaveBeenCalledWith(
    "https://api.clerk.com/oauth_applications/access_tokens/verify",
    expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({
        Authorization: "Bearer sk_test_backend",
      }),
      body: JSON.stringify({ access_token: "opaque-token" }),
    }),
  );
});

test("Clerk verification distinguishes invalid credentials from provider outages", async () => {
  const verify = (fetcher: typeof fetch) =>
    verifyClerkOAuthToken("opaque-token", {
      expectedIssuer: issuer,
      expectedResource: resource,
      secretKey: "sk_test_backend",
      fetcher,
    });

  await expect(
    verify(
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response(null, { status: 503 })),
    ),
  ).rejects.toBeInstanceOf(OAuthVerificationUnavailableError);
  await expect(
    verify(vi.fn<typeof fetch>().mockRejectedValue(new Error("network down"))),
  ).rejects.toBeInstanceOf(OAuthVerificationUnavailableError);
  await expect(
    verify(
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response(null, { status: 401 })),
    ),
  ).rejects.toThrow("invalid");
});

test("stored opaque credentials are encrypted and have a non-reversible fingerprint", async () => {
  const encryptionKey = btoa(
    String.fromCharCode(...new Uint8Array(32).fill(17)),
  )
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
  const accessToken = "oat_secret_for_revoke";
  const encrypted = await encryptOAuthToken(accessToken, encryptionKey);

  expect(encrypted).not.toContain(accessToken);
  expect(await decryptOAuthToken(encrypted, encryptionKey)).toBe(accessToken);
  const otherEncryptionKey = btoa(
    String.fromCharCode(...new Uint8Array(32).fill(18)),
  )
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
  await expect(
    decryptOAuthToken(encrypted, otherEncryptionKey),
  ).rejects.toThrow();
  expect(await fingerprintOAuthToken(accessToken)).toBe(
    await fingerprintOAuthToken(accessToken),
  );
  expect(await fingerprintOAuthToken(accessToken)).not.toBe(
    await fingerprintOAuthToken("another-token"),
  );
});

test("read-only grants list only read tools and cannot call write tools", async () => {
  const execute = vi.fn(async () => ({ ok: true }));
  const list = await dispatchRemoteMcpMessage(
    { jsonrpc: "2.0", id: 1, method: "tools/list" },
    { scopes: [MCP_READ_SCOPE], tools: testTools, execute },
  );
  const result = (list.body as Record<string, unknown> | undefined)?.result as {
    tools: Array<{ name: string }>;
  };

  expect(result.tools.map((tool) => tool.name)).toEqual(["get_orbit"]);
  const write = await dispatchRemoteMcpMessage(
    {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name: "commit_today", arguments: {} },
    },
    { scopes: [MCP_READ_SCOPE], tools: testTools, execute },
  );

  expect(write.status).toBe(403);
  expect(write.requiredScope).toBe(MCP_WRITE_SCOPE);
  expect(execute).not.toHaveBeenCalled();
});

test("authorized tools execute and protocol notifications do not return JSON-RPC bodies", async () => {
  const execute = vi.fn(async (name: string) => ({ tool: name }));
  const response = await dispatchRemoteMcpMessage(
    {
      jsonrpc: "2.0",
      id: "call-1",
      method: "tools/call",
      params: { name: "commit_today", arguments: {} },
    },
    { scopes: [MCP_WRITE_SCOPE], tools: testTools, execute },
  );
  const result = (response.body as Record<string, unknown> | undefined)
    ?.result as {
    content: Array<{ text: string }>;
    isError: boolean;
  };

  expect(response.status).toBe(200);
  expect(JSON.parse(result.content[0]?.text ?? "{}")).toEqual({
    tool: "commit_today",
  });
  expect(result.isError).toBe(false);
  await expect(
    dispatchRemoteMcpMessage(
      { jsonrpc: "2.0", method: "notifications/initialized" },
      { scopes: [MCP_WRITE_SCOPE], tools: testTools, execute },
    ),
  ).resolves.toEqual({ status: 202 });

  await expect(
    dispatchRemoteMcpMessage(
      { jsonrpc: "2.0", id: 3, method: "notifications/initialized" },
      { scopes: [MCP_WRITE_SCOPE], tools: testTools, execute },
    ),
  ).resolves.toMatchObject({
    status: 200,
    body: { id: 3, error: { code: -32601 } },
  });
});

test("MCP initialize negotiates a supported client protocol version", async () => {
  const initialize = async (protocolVersion: string) => {
    return await dispatchRemoteMcpMessage(
      {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: { protocolVersion },
      },
      { scopes: [MCP_READ_SCOPE], tools: testTools, execute: vi.fn() },
    );
  };

  const olderVersion = await initialize("2025-06-18");
  const unsupportedVersion = await initialize("2024-11-05");

  expect(olderVersion.protocolVersion).toBe("2025-06-18");
  expect(olderVersion.body).toMatchObject({
    result: { protocolVersion: "2025-06-18" },
  });
  expect(unsupportedVersion.protocolVersion).toBe("2025-11-25");
  expect(unsupportedVersion.body).toMatchObject({
    result: { protocolVersion: "2025-11-25" },
  });
});

test("MCP protocol accepts supported versions and the legacy missing header", () => {
  expect(supportsMcpProtocolVersion(null)).toBe(true);
  expect(supportsMcpProtocolVersion("2025-03-26")).toBe(true);
  expect(supportsMcpProtocolVersion("2025-06-18")).toBe(true);
  expect(supportsMcpProtocolVersion("2025-11-25")).toBe(true);
  expect(supportsMcpProtocolVersion("1999-01-01")).toBe(false);
});
