# AGENTS.md

Instructions for AI coding agents in this repository.

## Product

**Orbii** keeps many habits in an Orbit and surfaces a small daily focus set. Users pick up to capacity from a fixed-size offer, commit, complete — success is “Today’s Orbit complete,” not coverage of the full Orbit. V1 is for the creator + a few trusted users.

**Source of truth is GitHub Issues — not markdown trees in this repo.**

| Artifact | Where |
|----------|--------|
| Canonical V1 spec + locked decisions | [Spec: Orbii V1 (approved)](https://github.com/pedrotmr/orbii/issues/15) |
| Wayfinder map / frontier | [Wayfinder: path to trusted-user V1](https://github.com/pedrotmr/orbii/issues/1) |
| Work tickets | Issues labelled `ready-for-agent` (claim with assignee) |
| Visual reference only | `design-ideas/` (not production code) |

## Architecture

Turborepo + pnpm. Mobile-only V1 (no web app).

| Path | Role |
|------|------|
| `apps/mobile` | Expo app + Convex client |
| `packages/backend` | Convex schema, ritual mutations, Vitest |
| `packages/tokens` | Shared color/type/spacing for RN |
| `design-ideas/` | Throwaway Vite prototype |

## Invariants

- Orbit ≠ today’s checklist. Never score the day as “X of N Orbit habits.”
- UI does not invent offer, capacity, phase, or streak rules — Convex is source of truth (once wired).
- Streak = consecutive local calendar days with a **completed** committed Orbit (miss = break).
- Offer size is fixed at 5 in V1; capacity is 1–5 (default 2).
- No XP, smart scheduling, notifications, or web app unless the Spec issue gets a dated addendum.
- Do not import `design-ideas/` into the production apps.

## Commands

```bash
pnpm install
pnpm dev              # turbo: convex + expo
pnpm test             # backend Vitest
pnpm typecheck
```

## Conventions

- TypeScript strict; prefer clear names over cleverness.
- Match mira-la-cancha monorepo shape where it helps; don’t copy Mira domain code.
- Domain selection/streak logic: testable pure helpers + thin Convex wrappers.
- One concern per PR. Tooling (prettier/eslint/CI) never rides along with product PRs.

## Session continuation

- **Before coding:** open the [wayfinder map](https://github.com/pedrotmr/orbii/issues/1); claim an unblocked `ready-for-agent` issue; read [Spec #15](https://github.com/pedrotmr/orbii/issues/15) if the area touches product rules.
- **While coding:** non-obvious product choices → comment on Spec #15 (dated addendum) or open a wayfinder grilling ticket — do not invent a parallel markdown log in git.
- **If scope diverges from the Spec:** update Spec #15 (or link a decision ticket) before merging.
- **Before ending a session:** leave the GitHub issue in a truthful state (comment progress, close if done, unassign if blocked).
