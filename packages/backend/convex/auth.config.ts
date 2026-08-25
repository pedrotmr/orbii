import type { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      // Set on the Convex deployment (already present for orbii) and mirrored
      // in packages/backend/.env.local for local `convex dev`.
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
