# AGENTS.md

Instructions for AI coding agents in this repository.

## Product

**Orbii** keeps many habits in an Orbit and surfaces a small daily focus set. Users pick up to capacity from a fixed-size offer, commit, complete — success is “Today’s Orbit complete,” not coverage of the full Orbit. V1 is for the creator + a few trusted users.

Canonical design: `specs/2026-08-24-orbii-v1-design.md`  
Visual reference only: `design-ideas/` (not production code)

## Architecture

Turborepo + pnpm. Mobile-only V1 (no web app).

| Path | Role |
|------|------|
| `apps/mobile` | Expo Router + Convex client |
| `packages/backend` | Convex schema, ritual mutations, Vitest |
| `packages/tokens` | Shared color/type/spacing for RN |
| `design-ideas/` | Throwaway Vite prototype / DESIGN.md |

## Invariants

- Orbit ≠ today’s checklist. Never score the day as “X of N Orbit habits.”
- UI does not invent offer, capacity, phase, or streak rules — Convex is source of truth.
- Streak = consecutive local calendar days with a **completed** committed Orbit (miss = break).
- Offer size is fixed at 5 in V1; capacity is 1–5 (default 2).
- No XP, smart scheduling, notifications, or web app unless the spec gets a dated addendum.
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
- Scope changes → dated addendum on the V1 spec, not silent drift.

## Session continuation

- **Before coding:** read `docs/STATUS.md`; scan `docs/DECISIONS.md` for the area you’re touching.
- **While coding:** append non-obvious choices to `docs/DECISIONS.md`.
- **If scope diverges from the spec:** dated addendum on the spec — don’t silently drift.
- **Before ending a session:** update `docs/STATUS.md` with shipped / next / blocked.

Pointers: `specs/2026-08-24-orbii-v1-design.md` · `docs/DECISIONS.md` · `docs/STATUS.md`
