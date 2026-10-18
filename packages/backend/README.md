## Convex backend (@orbii/backend)

Pure ritual helpers and shared points logic live in `convex/lib/`; backend tests cover the domain without a Convex deployment.

Convex functions cover user settings (`users`), habits (`habits`), daily rituals (`day`), point history (`points`), and reward goals and redemptions (`rewards`) against the provisioned project.

### Project

|                |                                                             |
| -------------- | ----------------------------------------------------------- |
| Team           | `pedrotr`                                                   |
| Project        | `orbii`                                                     |
| Dev deployment | `posh-otter-652` (`dev/pedrotr`)                            |
| Dashboard      | https://dashboard.convex.dev/t/pedrotr/orbii/posh-otter-652 |
| Client URL     | `https://posh-otter-652.convex.cloud`                       |

Mobile reads the same URL via `EXPO_PUBLIC_CONVEX_URL` and calls generated `api` from `@orbii/backend`. Commit `convex/_generated/` so clients typecheck without a live CLI session.

### Habit ordering migration

The `habits.order` field remains optional while existing records are backfilled. After deploying the widened schema and functions, run the migration from `packages/backend`:

```bash
pnpm exec convex run habits:backfillOrder
```

The migration scans habits in batches, groups them by owner, and assigns order
in creation-time order. It includes habits even when the owner has no user
record. Rerunning it skips owners whose habits already have an order, preserving
later manual reorders.

### Env layout

| File                            | Committed? | Purpose                                                       |
| ------------------------------- | ---------- | ------------------------------------------------------------- |
| `packages/backend/.env.local`   | no         | `CONVEX_DEPLOYMENT`, `CONVEX_URL`, `CONVEX_SITE_URL` for CLI  |
| `packages/backend/.env.example` | yes        | empty template                                                |
| `apps/mobile/.env.local`        | no         | `EXPO_PUBLIC_CONVEX_URL`, `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` |
| `apps/mobile/.env.example`      | yes        | empty template                                                |

Deploy keys / GitHub secrets are deferred until CI deploys Convex.

**Identity:** Clerk is required (hard gate). Convex functions use `ctx.auth`; documents key on `clerkUserId` (Clerk `subject`). Vertical-slice `clientUserId` data is discarded — no migration. Before pushing the Clerk schema to a deployment that still has slice docs, clear `users`, `habits`, and `daySessions` in the dashboard (or reset the deployment); otherwise Convex schema validation rejects the push.

Mobile: `clerk env pull` from `apps/mobile`; enable Native API at https://dashboard.clerk.com/~/native-applications; allow redirect URL `orbii://oauth-callback` for Google/Apple SSO; Convex JWT via Clerk’s Convex integration + `CLERK_JWT_ISSUER_DOMAIN` on the deployment (`npx convex env set`) and mirrored in `packages/backend/.env.local` when you keep a local copy.

### Remote MCP

The stateless Streamable HTTP endpoint is `https://<deployment>.convex.site/mcp`. It publishes OAuth Protected Resource Metadata at `/.well-known/oauth-protected-resource/mcp` and delegates sign-in and explicit client consent to the Clerk instance in `CLERK_JWT_ISSUER_DOMAIN`. OAuth access tokens are verified with Clerk's Backend API; their subjects are passed only to private, user-scoped Convex functions, never used as Convex auth tokens.

Before deploying the endpoint:

1. In Clerk's OAuth application settings, publish Client ID Metadata Document support and dynamic client registration so compatible MCP clients can onboard themselves.
2. Add the custom scopes `orbii:read` and `orbii:write`, with descriptions that explain the Orbit and daily ritual permissions. Enable consent for clients and require PKCE.
3. Set OAuth access tokens to opaque format. Clerk can revoke opaque access and refresh tokens immediately; JWT access tokens cannot be revoked.
4. Add `CLERK_SECRET_KEY` and `MCP_CREDENTIAL_ENCRYPTION_KEY` to the Convex deployment. Generate the latter as a base64url-encoded 32-byte key and keep the same value in every environment that serves MCP requests.
5. Keep `CLERK_JWT_ISSUER_DOMAIN` set to the Clerk Frontend API URL, as it is for the mobile Convex integration.

On the first authenticated MCP request, Orbii stores the client name, client ID, granted Orbii scopes, and an AES-GCM encrypted opaque access token. Settings → Connected agents blocks the token in Orbii before asking Clerk to revoke the access and refresh token. If Clerk does not confirm, the blocked connection stays visible so the owner can retry; Orbii erases the encrypted credential after Clerk confirms. Tool arguments never accept an Orbii user ID; the verified token subject is supplied to the internal Convex call.

The endpoint exposes `get_orbit` and `get_today` to `orbii:read` grants. `orbii:write` grants expose `start_today`, `rereveal_today`, `select_habit`, `deselect_habit`, `commit_today`, `complete_habit`, `uncomplete_habit`, `add_habit`, and `remove_habit`. Habit edits and reordering are not exposed.

### Local commands

```bash
cd packages/backend
pnpm exec convex deployment select pedrotr:orbii:dev   # once per machine
pnpm exec convex dev                                  # watch + push functions
```
