import { expect, test, vi } from "vitest";
import {
  decryptOAuthToken,
  encryptOAuthToken,
  fingerprintOAuthToken,
  MCP_READ_SCOPE,
  MCP_WRITE_SCOPE,
  parseVerifiedOAuthToken,
  verifyClerkOAuthToken,
} from "../convex/lib/remote-mcp-auth";
import {
  dispatchRemoteMcpMessage,
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
  user_id: "user_orbii_1",
  client_id: "oauthapp_agent_1",
  client_name: "Example agent",
  oauth_application_id: "oauthapp_agent_1",
  scopes: [MCP_READ_SCOPE, MCP_WRITE_SCOPE],
};

test("verified Clerk access tokens must identify an Orbii user, client, and scope", () => {
  expect(parseVerifiedOAuthToken(tokenClaims, issuer, resource)).toEqual({
    userId: "user_orbii_1",
    clientId: "oauthapp_agent_1",
    clientName: "Example agent",
    oauthApplicationId: "oauthapp_agent_1",
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
      { ...tokenClaims, expired: true },
      issuer,
      resource,
    ),
  ).toThrow("invalid");
  expect(() =>
    parseVerifiedOAuthToken(
      { user_id: "user_orbii_1", client_id: "client_1", scope: "profile" },
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
  await expect(
    decryptOAuthToken(encrypted, `${encryptionKey}x`),
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
});
