# AGENTS.md

Instructions for AI coding agents in this repository.

## Product

**Orbii** keeps many habits in an Orbit and surfaces a small daily focus set. Users choose from 1 up to the reveal offer size, commit, and complete — success is “Today’s Orbit complete,” not coverage of the full Orbit. V2 is for the creator + a few trusted users.

**Source of truth is GitHub Issues — not markdown trees in this repo.**

| Artifact                              | Where                                                                      |
| ------------------------------------- | -------------------------------------------------------------------------- |
| Canonical V2 spec + current decisions | [Spec: Orbii V2 (approved)](https://github.com/pedrotmr/orbii/issues/50)   |
| V1 spec (frozen history)              | [Spec: Orbii V1 (approved)](https://github.com/pedrotmr/orbii/issues/15)   |
| Wayfinder map / frontier              | [Wayfinder: path to Orbii V2](https://github.com/pedrotmr/orbii/issues/51) |
| Work tickets                          | Issues labelled `ready-for-agent` (claim with assignee)                    |
| Visual reference only                 | `design-ideas/` (not production code)                                      |

## Workspace layout

Turborepo + pnpm. Mobile-only Expo app; no web app in V2.

| Path                | Role                                                       |
| ------------------- | ---------------------------------------------------------- |
| `apps/mobile/`      | Expo + Convex client                                       |
| `packages/backend/` | Convex schema, ritual mutations, Vitest (`@orbii/backend`) |
| `packages/tokens/`  | Shared design tokens (`@orbii/tokens`)                     |
| `design-ideas/`     | Throwaway Vite prototype — do not import into production   |
| `.agents/skills/`   | Installed agent skills (`.claude` → `.agents`)             |

## Invariants

- Orbit ≠ today’s checklist. Never score the day as “X of N Orbit habits.”
- UI does not invent offer, capacity, phase, or streak rules — Convex is the source of truth.
- Streak = consecutive local calendar days with a **completed** committed Orbit (miss = break).
- Offer size is `min(5, Orbit size)`. The saved default capacity is 1–5 (default 2) and guides the user; the selected count from 1 through the offer size defines today’s capacity.
- Points and rewards follow Spec V2: habit awards, a fixed +20 completion bonus, and confirmed reward redemptions update one spendable balance. Points never score Orbit coverage.
- Daily reminders are opt-in and follow Spec V2.
- Social, smart scheduling, a web app, and a public App Store launch are out of scope for V2.
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

**Before finishing any work:** run `pnpm typecheck`, `pnpm lint`, `pnpm format:check` (and `pnpm test` when backend changed). GitHub Actions CI runs the same gates on PRs and `main`. One concern per PR — tooling never rides along with product PRs.

## Architecture

- **Backend:** schema in `packages/backend/convex/schema.ts`; feature modules beside it; pure ritual helpers in `convex/lib/`; tests in `packages/backend/tests/*.test.ts`.
- **Convex project:** team `pedrotr`, project `orbii`, dev deployment `posh-otter-652` (`https://posh-otter-652.convex.cloud`). Local secrets in `packages/backend/.env.local` and `apps/mobile/.env.local` (see `packages/backend/README.md`). Never commit those files.
- **Clients:** import `@orbii/backend` helpers / generated `api`. Mutations are the write source of truth.
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

- **Before coding:** open the [Wayfinder: path to Orbii V2](https://github.com/pedrotmr/orbii/issues/51); claim an unblocked `ready-for-agent` issue; read [Spec: Orbii V2 (approved)](https://github.com/pedrotmr/orbii/issues/50) for product rules. Spec V1 remains frozen history.
- **While coding:** non-obvious product choices → dated comment on Spec V2 or a wayfinder grilling ticket — no parallel markdown decision log in git.
- **If scope diverges from Spec V2:** update the spec before merging.
- **Before ending a session:** leave the GitHub issue truthful (progress comment, close if done, unassign if blocked).

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`packages/backend/convex/_generated/ai/guidelines.md` first** (after `convex dev` has generated it) for Convex API patterns that override training data.

Convex agent skills for common tasks: `npx convex ai-files install` (from `packages/backend` when appropriate).

<!-- convex-ai-end -->
