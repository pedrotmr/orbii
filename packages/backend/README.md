## Convex backend (@orbii/backend)

Pure ritual helpers live in `convex/lib/` and are unit-tested without a Convex deployment.

Convex functions (`users`, `habits`, `day`) persist the same ritual against the provisioned project.

### Project

|                |                                                             |
| -------------- | ----------------------------------------------------------- |
| Team           | `pedrotr`                                                   |
| Project        | `orbii`                                                     |
| Dev deployment | `posh-otter-652` (`dev/pedrotr`)                            |
| Dashboard      | https://dashboard.convex.dev/t/pedrotr/orbii/posh-otter-652 |
| Client URL     | `https://posh-otter-652.convex.cloud`                       |

Mobile reads the same URL via `EXPO_PUBLIC_CONVEX_URL` and calls generated `api` from `@orbii/backend`. Commit `convex/_generated/` so clients typecheck without a live CLI session.

### Env layout

| File                            | Committed? | Purpose                                                      |
| ------------------------------- | ---------- | ------------------------------------------------------------ |
| `packages/backend/.env.local`   | no         | `CONVEX_DEPLOYMENT`, `CONVEX_URL`, `CONVEX_SITE_URL` for CLI |
| `packages/backend/.env.example` | yes        | empty template                                               |
| `apps/mobile/.env.local`        | no         | `EXPO_PUBLIC_CONVEX_URL` for Expo                            |
| `apps/mobile/.env.example`      | yes        | empty template                                               |

Deploy keys / GitHub secrets are deferred until CI deploys Convex. Clerk env waits for identity cutover.

### Local commands

```bash
cd packages/backend
pnpm exec convex deployment select pedrotr:orbii:dev   # once per machine
pnpm exec convex dev                                  # watch + push functions
```
