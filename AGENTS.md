# AGENTS.md

Instructions for AI coding agents in this repository.

## Product

**Orbii** keeps many habits in an Orbit and surfaces a small daily focus set. Users pick up to capacity from a fixed-size offer, commit, complete — success is “Today’s Orbit complete,” not coverage of the full Orbit. V1 is for the creator + a few trusted users.

**Source of truth is GitHub Issues — not markdown trees in this repo.**

| Artifact                             | Where                                                                            |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| Canonical V1 spec + locked decisions | [Spec: Orbii V1 (approved)](https://github.com/pedrotmr/orbii/issues/15)         |
| Wayfinder map / frontier             | [Wayfinder: path to trusted-user V1](https://github.com/pedrotmr/orbii/issues/1) |
| Work tickets                         | Issues labelled `ready-for-agent` (claim with assignee)                          |
| Visual reference only                | `design-ideas/` (not production code)                                            |

## Workspace layout

Turborepo + pnpm. Mobile-only V1 (no web app).

| Path                | Role                                                       |
| ------------------- | ---------------------------------------------------------- |
| `apps/mobile/`      | Expo + Convex client                                       |
| `packages/backend/` | Convex schema, ritual mutations, Vitest (`@orbii/backend`) |
| `packages/tokens/`  | Shared design tokens (`@orbii/tokens`)                     |
| `design-ideas/`     | Throwaway Vite prototype — do not import into production   |
| `.agents/skills/`   | Installed agent skills (`.claude` → `.agents`)             |

## Invariants

- Orbit ≠ today’s checklist. Never score the day as “X of N Orbit habits.”
- UI does not invent offer, capacity, phase, or streak rules — Convex is source of truth (once wired).
- Streak = consecutive local calendar days with a **completed** committed Orbit (miss = break).
- Offer size is fixed at 5 in V1; capacity is 1–5 (default 2).
- No XP, smart scheduling, notifications, or web app unless Spec #15 gets a dated addendum.
- Do not import `design-ideas/` into the production apps.

## Commands

```bash
pnpm install
pnpm dev              # turbo: convex + expo
pnpm test             # backend Vitest
pnpm typecheck
pnpm lint             # eslint .
pnpm format           # prettier --write
pnpm format:check
```

Workspace-scoped:

```bash
pnpm --filter @orbii/backend dev
pnpm --filter @orbii/backend test
pnpm --filter @orbii/backend typecheck
pnpm --filter @orbii/mobile start
```

**Before finishing any work:** run `pnpm typecheck`, `pnpm lint`, `pnpm format:check` (and `pnpm test` when backend changed). One concern per PR — tooling (prettier/eslint/CI) never rides along with product PRs.

## Architecture

- **Backend:** schema in `packages/backend/convex/schema.ts`; feature modules beside it; pure ritual helpers in `convex/lib/`; tests in `packages/backend/tests/*.test.ts`.
- **Clients:** import `@orbii/backend` helpers / generated `api` when Convex is wired. Mutations are the write source of truth.
- **Tokens:** never hardcode colors, radii, or shadows in apps — import `@orbii/tokens`.

## Conventions

- Commits: [Conventional Commits](https://www.conventionalcommits.org/), **all lowercase** (e.g. `feat: add capacity settings`, `chore: enable ci`). Imperative, concise; optional scope when useful (`feat(mobile): ...`).
- TypeScript everywhere. Named exports for shared modules; respect package boundaries.
- **Components:** `export default function ComponentName()` (or `export function` for shared module components). Do not use arrow functions for PascalCase components (`const Component = () =>` disallowed).
- **Functions vs components:** React components (PascalCase) use the `function` keyword. Everything else — hooks, utilities, handlers — uses `const` with an arrow function.
- **Control-flow braces:** Always curly braces for `if` / `else` / `for` / `while` / `do`, including single-statement and early-return bodies. Write `if (condition) { return value; }`, never `if (condition) return value;`.
- **Conditional spacing:** Exactly one blank line between consecutive sibling `if` statements (components, hooks, utilities, backend, tests).
- **React:** Before reaching for `useEffect`, read [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect).
- **Naming:** PascalCase components; camelCase functions/variables; kebab-case routes/docs where established.
- **Object shapes:** use `interface` for props and object records. Reserve `type` for unions, tuples, function signatures, mapped/conditional types, and aliases an interface cannot express.
- **Convex:** group by feature under `packages/backend/convex/`; add/update Vitest when changing schema, queries, mutations, or auth.
- Domain selection/streak logic: testable pure helpers + thin Convex wrappers.

### Mobile UI structure (`apps/mobile/`)

Follow [structural-cleanup folder conventions](.agents/skills/structural-cleanup/reference/FOLDER-CONVENTIONS.md). **Do not leave mess for a later cleanup pass.**

**One component per file.** Every PascalCase `function` component gets its own file. A `.tsx` file exports **one** component.

**Nest by ownership.** Screen folders own a named `*-screen.tsx` plus subfolders for sections/lists/chrome/states. Subfolders mirror the component tree.

**No index or forwarding files** in mobile source (Expo Router `app/**/index.tsx` is the only exception).

**Colocate styles.** Private `StyleSheet.create` at the bottom of the owning `.tsx`. A `*-styles.ts` file only when **two or more sibling** components share keys.

**Rendering:** prefer early-return `if` blocks for loading/empty/error over nested JSX ternaries. One-level ternaries for two-value picks are fine.

**Routes stay thin** (~20–40 lines): params, queries, navigation — screen body under `components/`.

## Commits and pull requests

PRs: short description, linked GitHub issue, test results, screenshots for UI. Call out new env vars and Convex steps. Squash or rebase merge only (no merge commits).

## Security and configuration

- Do not commit secrets or local env files.
- Mobile env: `apps/mobile/.env` (e.g. `EXPO_PUBLIC_CONVEX_URL`, Clerk publishable key when auth lands).
- Convex secrets: dashboard only — not `.env` files in git.

## Session continuation

- **Before coding:** open the [wayfinder map](https://github.com/pedrotmr/orbii/issues/1); claim an unblocked `ready-for-agent` issue; read [Spec #15](https://github.com/pedrotmr/orbii/issues/15) if the area touches product rules.
- **While coding:** non-obvious product choices → dated comment on Spec #15 or a wayfinder grilling ticket — no parallel markdown decision log in git.
- **If scope diverges from the Spec:** update Spec #15 before merging.
- **Before ending a session:** leave the GitHub issue truthful (progress comment, close if done, unassign if blocked).

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`packages/backend/convex/_generated/ai/guidelines.md` first** (after `convex dev` has generated it) for Convex API patterns that override training data.

Convex agent skills for common tasks: `npx convex ai-files install` (from `packages/backend` when appropriate).

<!-- convex-ai-end -->
