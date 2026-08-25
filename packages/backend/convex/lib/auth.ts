import type { MutationCtx, QueryCtx } from "../_generated/server";

type AuthCtx = QueryCtx | MutationCtx;

/** Clerk subject from the JWT. Throws if the request is not authenticated. */
export const requireClerkUserId = async (ctx: AuthCtx) => {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("Not authenticated");
  }

  return identity.subject;
};
