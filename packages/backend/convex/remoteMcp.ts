import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalMutation, internalQuery, query } from "./_generated/server";
import { requireClerkUserId } from "./lib/auth";
import { MCP_READ_SCOPE, MCP_WRITE_SCOPE } from "./lib/remote_mcp_auth";

const allowedScopes = [MCP_READ_SCOPE, MCP_WRITE_SCOPE];

const normalizeScopes = (scopes: string[]) => {
  return [...new Set(scopes.filter((scope) => allowedScopes.includes(scope)))];
};

export const listConnections = query({
  args: {},
  handler: async (ctx) => {
    const clerkUserId = await requireClerkUserId(ctx);
    const connections = await ctx.db
      .query("agentConnections")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
      .collect();

    return connections
      .filter(
        (connection) =>
          connection.revokedAt === undefined ||
          connection.revocationPending === true,
      )
      .sort((left, right) => right.connectedAt - left.connectedAt)
      .map((connection) => ({
        _id: connection._id,
        clientId: connection.clientId,
        clientName: connection.clientName,
        scopes: connection.scopes,
        connectedAt: connection.connectedAt,
        lastSeenAt: connection.lastSeenAt,
        revocationPending: connection.revocationPending === true,
      }));
  },
});

export const authorizeToken = internalMutation({
  args: {
    clerkUserId: v.string(),
    clientId: v.string(),
    clientName: v.string(),
    oauthApplicationId: v.string(),
    scopes: v.array(v.string()),
    tokenFingerprint: v.string(),
    encryptedAccessToken: v.string(),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const scopes = normalizeScopes(args.scopes);

    if (scopes.length === 0) {
      throw new Error("OAuth access token has no Orbii MCP scopes");
    }

    const matchingToken = await ctx.db
      .query("agentConnections")
      .withIndex("by_clerkUserId_tokenFingerprint", (q) =>
        q
          .eq("clerkUserId", args.clerkUserId)
          .eq("tokenFingerprint", args.tokenFingerprint),
      )
      .unique();

    if (matchingToken?.revokedAt !== undefined) {
      return null;
    }

    if (matchingToken) {
      await ctx.db.patch(matchingToken._id, {
        clientName: args.clientName.slice(0, 160),
        oauthApplicationId: args.oauthApplicationId,
        scopes,
        encryptedAccessToken: args.encryptedAccessToken,
        lastSeenAt: args.now,
      });
      return matchingToken._id;
    }

    const clientConnections = await ctx.db
      .query("agentConnections")
      .withIndex("by_clerkUserId_clientId", (q) =>
        q.eq("clerkUserId", args.clerkUserId).eq("clientId", args.clientId),
      )
      .collect();
    if (clientConnections.some((connection) => connection.revocationPending)) {
      return null;
    }

    return await ctx.db.insert("agentConnections", {
      clerkUserId: args.clerkUserId,
      clientId: args.clientId,
      clientName: args.clientName.slice(0, 160),
      oauthApplicationId: args.oauthApplicationId,
      scopes,
      tokenFingerprint: args.tokenFingerprint,
      encryptedAccessToken: args.encryptedAccessToken,
      connectedAt: args.now,
      lastSeenAt: args.now,
    });
  },
});

const getOwnedConnection = async (
  ctx: { db: any },
  clerkUserId: string,
  connectionId: Id<"agentConnections">,
) => {
  const connection = await ctx.db.get(connectionId);

  if (
    !connection ||
    connection.clerkUserId !== clerkUserId ||
    (connection.revokedAt !== undefined && !connection.revocationPending)
  ) {
    return null;
  }

  return connection;
};

export const getConnectionForOwner = internalQuery({
  args: {
    clerkUserId: v.string(),
    connectionId: v.id("agentConnections"),
  },
  handler: async (ctx, args) => {
    const connection = await getOwnedConnection(
      ctx,
      args.clerkUserId,
      args.connectionId,
    );

    if (!connection) {
      return null;
    }

    return {
      connectionId: connection._id,
      oauthApplicationId: connection.oauthApplicationId,
      encryptedAccessToken: connection.encryptedAccessToken,
    };
  },
});

export const getOAuthApplicationForClient = internalQuery({
  args: { clerkUserId: v.string(), clientId: v.string() },
  handler: async (ctx, args) => {
    const connections = await ctx.db
      .query("agentConnections")
      .withIndex("by_clerkUserId_clientId", (q) =>
        q.eq("clerkUserId", args.clerkUserId).eq("clientId", args.clientId),
      )
      .collect();
    const activeConnection = connections.find(
      (connection) => connection.revokedAt === undefined,
    );

    if (!activeConnection) {
      return null;
    }

    return {
      id: activeConnection.oauthApplicationId,
      name: activeConnection.clientName,
    };
  },
});

export const markConnectionRevoked = internalMutation({
  args: {
    clerkUserId: v.string(),
    connectionId: v.id("agentConnections"),
    revokedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const connection = await getOwnedConnection(
      ctx,
      args.clerkUserId,
      args.connectionId,
    );

    if (!connection) {
      return false;
    }

    await ctx.db.patch(connection._id, {
      revokedAt: connection.revokedAt ?? args.revokedAt,
      revocationPending: true,
    });
    return true;
  },
});

export const finishConnectionRevocation = internalMutation({
  args: {
    clerkUserId: v.string(),
    connectionId: v.id("agentConnections"),
  },
  handler: async (ctx, args) => {
    const connection = await getOwnedConnection(
      ctx,
      args.clerkUserId,
      args.connectionId,
    );

    if (!connection || !connection.revocationPending) {
      return false;
    }

    await ctx.db.patch(connection._id, {
      revocationPending: false,
      encryptedAccessToken: "",
    });
    return true;
  },
});
