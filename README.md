# Orbii

Personal habit app: many habits in your Orbit, a small focus set each day.

## Status

V1 spec approved. Monorepo bootstrap + vertical slice in progress — see `docs/STATUS.md`.

| Path | Role |
|------|------|
| `apps/mobile` | Expo app (daily ritual slice) |
| `packages/backend` | Ritual domain + Convex functions |
| `packages/tokens` | Shared design tokens |
| `design-ideas/` | Throwaway visual prototype |
| `specs/` | Approved V1 design |

## Setup

```bash
pnpm install
pnpm test                 # ritual unit tests
pnpm --filter @orbii/mobile dev
```

Convex (optional for now — slice persists on-device):

```bash
pnpm --filter @orbii/backend dev
```

## Agents

Read `AGENTS.md` (symlinked as `CLAUDE.md`).
