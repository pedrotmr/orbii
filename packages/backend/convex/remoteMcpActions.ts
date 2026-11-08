import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import { decryptOAuthToken } from "./lib/remote_mcp_auth";

export const revokeConnection = action({
  args: { connectionId: v.id("agentConnections") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const clerkUserId = identity.subject;
    const connection = await ctx.runQuery(
      internal.remoteMcp.getConnectionForOwner,
      {
        clerkUserId,
        connectionId: args.connectionId,
      },
    );

    if (!connection) {
      throw new Error("Connected agent not found");
    }

    await ctx.runMutation(internal.remoteMcp.markConnectionRevoked, {
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

      await ctx.runMutation(internal.remoteMcp.finishConnectionRevocation, {
        clerkUserId,
        connectionId: connection.connectionId,
      });
      return { revoked: true, providerRevoked: true };
    } catch {
      return { revoked: true, providerRevoked: false };
    }
  },
});
