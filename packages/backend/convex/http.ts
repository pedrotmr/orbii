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
} from "./lib/remote-mcp-auth";
import { resolveClerkOAuthApplicationId } from "./lib/remote-mcp-clerk";
import {
  dispatchRemoteMcpMessage,
  MCP_PROTOCOL_VERSION,
  supportsMcpProtocolVersion,
  type RemoteMcpTool,
} from "./lib/remote-mcp-protocol";

const objectSchema = (
  properties: Record<string, unknown> = {},
  required: string[] = [],
) => ({
  type: "object" as const,
  properties,
  ...(required.length > 0 ? { required } : {}),
  additionalProperties: false as const,
});

const stringProperty = { type: "string", minLength: 1 };

const tools: RemoteMcpTool[] = [
  {
    name: "get_orbit",
    title: "Get Orbit",
    description: "List the habits saved in the user's Orbit.",
    requiredScope: MCP_READ_SCOPE,
    inputSchema: objectSchema(),
  },
  {
    name: "get_today",
    title: "Get today's ritual",
    description:
      "Read today's phase and offer, tentative selections, committed habits, or completion state.",
    requiredScope: MCP_READ_SCOPE,
    inputSchema: objectSchema(),
  },
  {
    name: "start_today",
    title: "Start today's reveal",
    description: "Start today's ritual and create its reveal offer.",
    requiredScope: MCP_WRITE_SCOPE,
    inputSchema: objectSchema(),
  },
  {
    name: "rereveal_today",
    title: "Re-reveal today's offer",
    description:
      "Replace an incomplete commitment with a fresh offer for today.",
    requiredScope: MCP_WRITE_SCOPE,
    inputSchema: objectSchema(),
  },
  {
    name: "select_habit",
    title: "Select an offered habit",
    description: "Select one habit from today's reveal offer.",
    requiredScope: MCP_WRITE_SCOPE,
    inputSchema: objectSchema({ habitId: stringProperty }, ["habitId"]),
  },
  {
    name: "deselect_habit",
    title: "Deselect an offered habit",
    description: "Deselect one habit from today's reveal offer.",
    requiredScope: MCP_WRITE_SCOPE,
    inputSchema: objectSchema({ habitId: stringProperty }, ["habitId"]),
  },
  {
    name: "commit_today",
    title: "Commit today's Orbit",
    description: "Commit the habits selected from today's offer.",
    requiredScope: MCP_WRITE_SCOPE,
    inputSchema: objectSchema(),
  },
  {
    name: "complete_habit",
    title: "Complete a committed habit",
    description: "Mark one committed habit complete for today.",
    requiredScope: MCP_WRITE_SCOPE,
    inputSchema: objectSchema({ habitId: stringProperty }, ["habitId"]),
  },
  {
    name: "uncomplete_habit",
    title: "Uncomplete a committed habit",
    description: "Mark one committed habit incomplete for today.",
    requiredScope: MCP_WRITE_SCOPE,
    inputSchema: objectSchema({ habitId: stringProperty }, ["habitId"]),
  },
  {
    name: "add_habit",
    title: "Add an Orbit habit",
    description:
      "Add a habit to the Orbit. Added habits become available in a future reveal.",
    requiredScope: MCP_WRITE_SCOPE,
    inputSchema: objectSchema(
      {
        name: { ...stringProperty, maxLength: 50 },
        glyph: { ...stringProperty, maxLength: 50 },
        category: {
          type: "string",
          enum: ["body", "mind", "learn", "life"],
        },
      },
      ["name", "glyph", "category"],
    ),
  },
  {
    name: "remove_habit",
    title: "Remove an Orbit habit",
    description:
      "Remove a habit from the Orbit. Removal immediately updates today's session.",
    requiredScope: MCP_WRITE_SCOPE,
    inputSchema: objectSchema({ habitId: stringProperty }, ["habitId"]),
  },
];

const assertArguments = (
  args: Record<string, unknown>,
  allowed: string[],
  required: string[] = [],
) => {
  if (Object.keys(args).some((key) => !allowed.includes(key))) {
    throw new Error("Tool arguments contain unsupported fields");
  }

  for (const key of required) {
    if (args[key] === undefined) {
      throw new Error(`Tool argument '${key}' is required`);
    }
  }
};

const requiredString = (args: Record<string, unknown>, key: string) => {
  const value = args[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Tool argument '${key}' must be a non-empty string`);
  }

  return value;
};

const getToday = async (ctx: ActionCtx, clerkUserId: string) => {
  return await ctx.runQuery(internal.day.getForRemoteMcp, { clerkUserId });
};

const todaySummary = async (ctx: ActionCtx, clerkUserId: string) => {
  const day = await getToday(ctx, clerkUserId);

  if (day.phase === "reveal") {
    return {
      localDate: day.localDate,
      phase: day.phase,
      offeredHabits: day.offeredHabits,
      selectedHabits: day.selectedHabits,
    };
  }

  if (day.phase === "active" || day.phase === "complete") {
    return {
      localDate: day.localDate,
      phase: day.phase,
      committedHabits: day.committedHabits,
      completedHabitIds: day.completedHabitIds,
      complete: day.complete,
    };
  }

  return { localDate: day.localDate, phase: day.phase };
};

const executeTool = async (
  ctx: ActionCtx,
  clerkUserId: string,
  name: string,
  args: Record<string, unknown>,
) => {
  if (name === "get_orbit") {
    assertArguments(args, []);
    return await ctx.runQuery(internal.habits.listForRemoteMcp, {
      clerkUserId,
    });
  }

  if (name === "get_today") {
    assertArguments(args, []);
    return await todaySummary(ctx, clerkUserId);
  }

  const day = await getToday(ctx, clerkUserId);
  const localDate = day.localDate;

  if (name === "start_today") {
    assertArguments(args, []);
    await ctx.runMutation(internal.day.startRevealForRemoteMcp, {
      clerkUserId,
      localDate,
    });
    return await todaySummary(ctx, clerkUserId);
  }

  if (name === "rereveal_today") {
    assertArguments(args, []);
    await ctx.runMutation(internal.day.rerevealForRemoteMcp, {
      clerkUserId,
      localDate,
    });
    return await todaySummary(ctx, clerkUserId);
  }

  if (name === "select_habit" || name === "deselect_habit") {
    assertArguments(args, ["habitId"], ["habitId"]);
    await ctx.runMutation(internal.day.setSelectionForRemoteMcp, {
      clerkUserId,
      localDate,
      habitId: requiredString(args, "habitId"),
      selected: name === "select_habit",
    });
    return await todaySummary(ctx, clerkUserId);
  }

  if (name === "commit_today") {
    assertArguments(args, []);
    await ctx.runMutation(internal.day.commitForRemoteMcp, {
      clerkUserId,
      localDate,
    });
    return await todaySummary(ctx, clerkUserId);
  }

  if (name === "complete_habit" || name === "uncomplete_habit") {
    assertArguments(args, ["habitId"], ["habitId"]);
    await ctx.runMutation(internal.day.setCompleteForRemoteMcp, {
      clerkUserId,
      localDate,
      habitId: requiredString(args, "habitId"),
      completed: name === "complete_habit",
    });
    return await todaySummary(ctx, clerkUserId);
  }

  if (name === "add_habit") {
    assertArguments(
      args,
      ["name", "glyph", "category"],
      ["name", "glyph", "category"],
    );
    const category = requiredString(args, "category");

    if (!["body", "mind", "learn", "life"].includes(category)) {
      throw new Error("Tool argument 'category' is invalid");
    }

    await ctx.runMutation(internal.habits.addForRemoteMcp, {
      clerkUserId,
      habitKey: crypto.randomUUID(),
      name: requiredString(args, "name"),
      glyph: requiredString(args, "glyph"),
      category: category as "body" | "mind" | "learn" | "life",
    });
    return await ctx.runQuery(internal.habits.listForRemoteMcp, {
      clerkUserId,
    });
  }

  if (name === "remove_habit") {
    assertArguments(args, ["habitId"], ["habitId"]);
    await ctx.runMutation(internal.habits.removeForRemoteMcp, {
      clerkUserId,
      localDate,
      habitKey: requiredString(args, "habitId"),
    });
    return await todaySummary(ctx, clerkUserId);
  }

  throw new Error("Unknown Orbii tool");
};

const withCors = (response: Response) => {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type, Mcp-Protocol-Version, Mcp-Session-Id, Last-Event-ID",
  );
  headers.set("Access-Control-Expose-Headers", "WWW-Authenticate");
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

  let oauthApplicationId: string | null;

  try {
    oauthApplicationId =
      (await ctx.runQuery(internal.remoteMcp.getOAuthApplicationIdForClient, {
        clerkUserId: principal.userId,
        clientId: principal.clientId,
      })) ??
      (await resolveClerkOAuthApplicationId(principal.clientId, secretKey));
  } catch {
    return jsonResponse({ error: "temporarily_unavailable" }, 503);
  }

  if (!oauthApplicationId) {
    return jsonResponse({ error: "temporarily_unavailable" }, 503);
  }

  try {
    await ctx.runMutation(internal.remoteMcp.authorizeToken, {
      clerkUserId: principal.userId,
      clientId: principal.clientId,
      clientName: principal.clientName,
      oauthApplicationId,
      scopes: principal.scopes,
      tokenFingerprint: await fingerprintOAuthToken(accessToken),
      encryptedAccessToken: await encryptOAuthToken(accessToken, encryptionKey),
      now: Date.now(),
    });
  } catch {
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

  const dispatched = await dispatchRemoteMcpMessage(input, {
    scopes: principal.scopes,
    tools,
    execute: async (name, args) => {
      return await executeTool(ctx, principal.userId, name, args);
    },
  });

  if (dispatched.status === 202) {
    return withCors(new Response(null, { status: 202 }));
  }

  const headers = new Headers({
    "Content-Type": "application/json",
    "Mcp-Protocol-Version": MCP_PROTOCOL_VERSION,
  });

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
