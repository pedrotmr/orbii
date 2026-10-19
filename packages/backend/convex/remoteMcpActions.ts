import {
  type DefaultFunctionArgs,
  makeFunctionReference,
  type FunctionReference,
} from "convex/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { action } from "./_generated/server";
import { decryptOAuthToken } from "./lib/remote_mcp_auth";

interface GetConnectionForOwnerArgs extends DefaultFunctionArgs {
  clerkUserId: string;
  connectionId: Id<"agentConnections">;
}

interface OwnedConnection {
  connectionId: Id<"agentConnections">;
  oauthApplicationId: string;
  encryptedAccessToken: string;
}

interface MarkConnectionRevokedArgs extends DefaultFunctionArgs {
  clerkUserId: string;
  connectionId: Id<"agentConnections">;
  revokedAt: number;
}

const getConnectionForOwner = makeFunctionReference<
  "query",
  GetConnectionForOwnerArgs,
  OwnedConnection | null
>("remoteMcp:getConnectionForOwner") as unknown as FunctionReference<
  "query",
  "internal",
  GetConnectionForOwnerArgs,
  OwnedConnection | null
>;

const markConnectionRevoked = makeFunctionReference<
  "mutation",
  MarkConnectionRevokedArgs,
  boolean
>("remoteMcp:markConnectionRevoked") as unknown as FunctionReference<
  "mutation",
  "internal",
  MarkConnectionRevokedArgs,
  boolean
>;

interface FinishConnectionRevocationArgs extends DefaultFunctionArgs {
  clerkUserId: string;
  connectionId: Id<"agentConnections">;
}

const finishConnectionRevocation = makeFunctionReference<
  "mutation",
  FinishConnectionRevocationArgs,
  boolean
>("remoteMcp:finishConnectionRevocation") as unknown as FunctionReference<
  "mutation",
  "internal",
  FinishConnectionRevocationArgs,
  boolean
>;

export const revokeConnection = action({
  args: { connectionId: v.id("agentConnections") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const clerkUserId = identity.subject;
    const connection = await ctx.runQuery(getConnectionForOwner, {
      clerkUserId,
      connectionId: args.connectionId,
    });

    if (!connection) {
      throw new Error("Connected agent not found");
    }

    await ctx.runMutation(markConnectionRevoked, {
      clerkUserId,
      connectionId: connection.connectionId,
      revokedAt: Date.now(),
    });

    const secretKey = process.env.CLERK_SECRET_KEY;
    const encryptionKey = process.env.MCP_CREDENTIAL_ENCRYPTION_KEY;

    if (!secretKey || !encryptionKey) {
      return { revoked: true, providerRevoked: false };
    }

    try {
      const accessToken = await decryptOAuthToken(
        connection.encryptedAccessToken,
        encryptionKey,
      );

      const response = await fetch(
        `https://api.clerk.com/v1/oauth_applications/${encodeURIComponent(connection.oauthApplicationId)}/revoke_token`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: accessToken }),
        },
      );

      if (!response.ok) {
        return { revoked: true, providerRevoked: false };
      }

      await ctx.runMutation(finishConnectionRevocation, {
        clerkUserId,
        connectionId: connection.connectionId,
      });
      return { revoked: true, providerRevoked: true };
    } catch {
      return { revoked: true, providerRevoked: false };
    }
  },
});
