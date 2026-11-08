import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction, type ActionCtx } from "./_generated/server";
import {
  encryptOAuthToken,
  fingerprintOAuthToken,
  MCP_READ_SCOPE,
  MCP_WRITE_SCOPE,
  OAuthVerificationUnavailableError,
  verifyClerkOAuthToken,
} from "./lib/remote_mcp_auth";
import {
  resolveClerkOAuthApplication,
  type ResolvedClerkOAuthApplication,
} from "./lib/remote_mcp_clerk";
import {
  dispatchRemoteMcpMessage,
  MCP_DEFAULT_PROTOCOL_VERSION,
  supportsMcpProtocolVersion,
} from "./lib/remote_mcp_protocol";
import { executeRemoteMcpTool, remoteMcpTools } from "./lib/remote_mcp_tools";

const withCors = (response: Response) => {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type, Mcp-Protocol-Version, Mcp-Session-Id, Last-Event-ID",
  );
  headers.set(
    "Access-Control-Expose-Headers",
    "WWW-Authenticate, Mcp-Session-Id, Mcp-Protocol-Version",
  );
  headers.set("Vary", "Origin");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

const jsonResponse = (
  value: unknown,
  status: number,
  headers?: HeadersInit,
) => {
  return withCors(
    Response.json(value, {
      status,
      headers,
    }),
  );
};

const oauthIssuer = () => {
  const issuer = process.env.CLERK_JWT_ISSUER_DOMAIN;

  if (!issuer) {
    throw new Error("Clerk OAuth issuer is not configured");
  }

  return issuer.replace(/\/+$/, "");
};

const resourceUrl = (request: Request) => {
  return new URL("/mcp", request.url).toString();
};

const isInitializeInput = (input: unknown) => {
  const message = Array.isArray(input) && input.length === 1 ? input[0] : input;

  return (
    typeof message === "object" &&
    message !== null &&
    !Array.isArray(message) &&
    (message as Record<string, unknown>).method === "initialize"
  );
};

const protectedResourceMetadata = (request: Request) => {
  const issuer = oauthIssuer();
  return {
    resource: resourceUrl(request),
    authorization_servers: [issuer],
    scopes_supported: [MCP_READ_SCOPE, MCP_WRITE_SCOPE],
    bearer_methods_supported: ["header"],
  };
};

const handleMcpRequest = async (ctx: ActionCtx, request: Request) => {
  const resource = resourceUrl(request);
  const metadataUrl = new URL(
    "/.well-known/oauth-protected-resource/mcp",
    request.url,
  ).toString();
  const challenge = `Bearer resource_metadata="${metadataUrl}"`;
  const authorization = request.headers.get("Authorization");
  const accessToken = authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];

  if (!accessToken) {
    return jsonResponse({ error: "unauthorized" }, 401, {
      "WWW-Authenticate": challenge,
    });
  }

  let issuer: string;
  let secretKey: string;
  let encryptionKey: string;

  try {
    issuer = oauthIssuer();
    secretKey = process.env.CLERK_SECRET_KEY ?? "";
    encryptionKey = process.env.MCP_CREDENTIAL_ENCRYPTION_KEY ?? "";
  } catch {
    return jsonResponse({ error: "OAuth service is not configured" }, 503);
  }

  if (!secretKey || !encryptionKey) {
    return jsonResponse({ error: "OAuth service is not configured" }, 503);
  }

  let principal;

  try {
    principal = await verifyClerkOAuthToken(accessToken, {
      expectedIssuer: issuer,
      expectedResource: resource,
      secretKey,
    });
  } catch (error) {
    if (error instanceof OAuthVerificationUnavailableError) {
      return jsonResponse({ error: "temporarily_unavailable" }, 503);
    }

    return jsonResponse({ error: "invalid_token" }, 401, {
      "WWW-Authenticate": `${challenge}, error="invalid_token"`,
    });
  }

  let oauthApplication: ResolvedClerkOAuthApplication | null;

  try {
    const storedApplication = await ctx.runQuery(
      internal.remoteMcp.getOAuthApplicationForClient,
      {
        clerkUserId: principal.userId,
        clientId: principal.clientId,
      },
    );
    const resolvedApplication = storedApplication
      ? null
      : await resolveClerkOAuthApplication(principal.clientId, secretKey);
    const applicationId =
      storedApplication?.id ?? resolvedApplication?.id ?? null;
    const resolvedClientName =
      principal.clientName !== principal.clientId
        ? principal.clientName
        : storedApplication
          ? storedApplication.name
          : (resolvedApplication?.name ?? principal.clientName);

    oauthApplication = applicationId
      ? { id: applicationId, name: resolvedClientName }
      : null;
  } catch {
    return jsonResponse({ error: "temporarily_unavailable" }, 503);
  }

  if (!oauthApplication) {
    return jsonResponse({ error: "temporarily_unavailable" }, 503);
  }

  let tokenFingerprint: string;
  let encryptedAccessToken: string;

  try {
    tokenFingerprint = await fingerprintOAuthToken(accessToken);
    encryptedAccessToken = await encryptOAuthToken(accessToken, encryptionKey);
  } catch {
    return jsonResponse({ error: "temporarily_unavailable" }, 503);
  }

  let connectionAuthorized: boolean;

  try {
    const connectionId = await ctx.runMutation(
      internal.remoteMcp.authorizeToken,
      {
        clerkUserId: principal.userId,
        clientId: principal.clientId,
        clientName: oauthApplication.name ?? principal.clientName,
        oauthApplicationId: oauthApplication.id,
        scopes: principal.scopes,
        tokenFingerprint,
        encryptedAccessToken,
        now: Date.now(),
      },
    );
    connectionAuthorized = connectionId !== null;
  } catch {
    return jsonResponse({ error: "temporarily_unavailable" }, 503);
  }

  if (!connectionAuthorized) {
    return jsonResponse({ error: "invalid_token" }, 401, {
      "WWW-Authenticate": `${challenge}, error="invalid_token"`,
    });
  }

  let input: unknown;

  try {
    input = await request.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const sessionId = request.headers.get("Mcp-Session-Id") ?? undefined;
  if (!sessionId && !isInitializeInput(input)) {
    return jsonResponse({ error: "session_required" }, 400);
  }

  const dispatched = await dispatchRemoteMcpMessage(input, {
    scopes: principal.scopes,
    tools: remoteMcpTools,
    protocolVersion:
      request.headers.get("Mcp-Protocol-Version") ??
      MCP_DEFAULT_PROTOCOL_VERSION,
    sessionId,
    execute: async (name, args, requestId) => {
      if (!sessionId) {
        throw new Error("MCP session ID is required for tool calls");
      }

      return await executeRemoteMcpTool(ctx, name, args, {
        clerkUserId: principal.userId,
        clientId: principal.clientId,
        requestId,
        sessionId,
      });
    },
  });

  const responseProtocolVersion =
    ("protocolVersion" in dispatched ? dispatched.protocolVersion : null) ??
    request.headers.get("Mcp-Protocol-Version") ??
    MCP_DEFAULT_PROTOCOL_VERSION;

  if (dispatched.status === 202) {
    const headers = new Headers({
      "Mcp-Protocol-Version": responseProtocolVersion,
    });
    if (dispatched.sessionId) {
      headers.set("Mcp-Session-Id", dispatched.sessionId);
    }

    return withCors(
      new Response(null, {
        status: 202,
        headers,
      }),
    );
  }

  const headers = new Headers({
    "Content-Type": "application/json",
    "Mcp-Protocol-Version": responseProtocolVersion,
  });
  if (dispatched.sessionId) {
    headers.set("Mcp-Session-Id", dispatched.sessionId);
  }

  if (dispatched.requiredScope) {
    headers.set(
      "WWW-Authenticate",
      `${challenge}, error="insufficient_scope", scope="${dispatched.requiredScope}"`,
    );
  }

  return jsonResponse(dispatched.body, dispatched.status, headers);
};

const mcpHandler = httpAction(async (ctx, request) => {
  if (
    !supportsMcpProtocolVersion(request.headers.get("Mcp-Protocol-Version"))
  ) {
    return jsonResponse({ error: "Unsupported MCP protocol version" }, 400);
  }

  const accept = request.headers.get("Accept") ?? "*/*";

  if (!accept.includes("application/json") && !accept.includes("*/*")) {
    return withCors(new Response(null, { status: 406 }));
  }

  return await handleMcpRequest(ctx, request);
});

const unsupportedMcpMethodHandler = httpAction(async () => {
  return withCors(
    new Response(null, {
      status: 405,
      headers: { Allow: "POST, OPTIONS" },
    }),
  );
});

const metadataHandler = httpAction(async (_ctx, request) => {
  try {
    return jsonResponse(protectedResourceMetadata(request), 200, {
      "Cache-Control": "public, max-age=300",
    });
  } catch {
    return jsonResponse({ error: "OAuth service is not configured" }, 503);
  }
});

const authorizationServerMetadataHandler = httpAction(async () => {
  let issuer: string;

  try {
    issuer = oauthIssuer();
  } catch {
    return jsonResponse({ error: "OAuth service is not configured" }, 503);
  }

  try {
    const response = await fetch(
      new URL("/.well-known/oauth-authorization-server", issuer),
    );

    if (!response.ok) {
      return jsonResponse({ error: "OAuth metadata is unavailable" }, 503);
    }

    const metadata: unknown = await response.json();

    if (
      typeof metadata !== "object" ||
      metadata === null ||
      Array.isArray(metadata) ||
      !("issuer" in metadata) ||
      metadata.issuer !== issuer
    ) {
      return jsonResponse({ error: "OAuth metadata is invalid" }, 503);
    }

    return jsonResponse(metadata, 200, {
      "Cache-Control": "public, max-age=300",
    });
  } catch {
    return jsonResponse({ error: "OAuth metadata is unavailable" }, 503);
  }
});

const optionsHandler = httpAction(async () => {
  return withCors(new Response(null, { status: 204 }));
});

const router = httpRouter();
router.route({ path: "/mcp", method: "POST", handler: mcpHandler });
router.route({
  path: "/mcp",
  method: "GET",
  handler: unsupportedMcpMethodHandler,
});
router.route({
  path: "/mcp",
  method: "DELETE",
  handler: unsupportedMcpMethodHandler,
});
router.route({ path: "/mcp", method: "OPTIONS", handler: optionsHandler });
router.route({
  path: "/.well-known/oauth-protected-resource",
  method: "OPTIONS",
  handler: optionsHandler,
});
router.route({
  path: "/.well-known/oauth-protected-resource/mcp",
  method: "OPTIONS",
  handler: optionsHandler,
});
router.route({
  path: "/.well-known/oauth-authorization-server",
  method: "GET",
  handler: authorizationServerMetadataHandler,
});
router.route({
  path: "/.well-known/oauth-authorization-server",
  method: "OPTIONS",
  handler: optionsHandler,
});
router.route({
  path: "/.well-known/oauth-protected-resource",
  method: "GET",
  handler: metadataHandler,
});
router.route({
  path: "/.well-known/oauth-protected-resource/mcp",
  method: "GET",
  handler: metadataHandler,
});

export default router;
