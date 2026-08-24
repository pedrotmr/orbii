# Status

Updated: 2026-08-24

## Done

- [x] Discovery + consensus; V1 spec approved (`specs/2026-08-24-orbii-v1-design.md`)
- [x] Agent artifacts: `AGENTS.md`, `CLAUDE.md` → symlink, `docs/DECISIONS.md`, `docs/STATUS.md`
- [x] Mira-shaped monorepo: `apps/mobile`, `packages/backend`, `packages/tokens`
- [x] Pure ritual domain + 14 Vitest tests (offer/pick/commit/complete/streak B)
- [x] Convex schema + `users` / `habits` / `day` functions (needs `convex dev` for `_generated`)
- [x] Mobile vertical slice: seed Orbit → reveal → pick → commit → complete (AsyncStorage)

## In flight

- (none)

## Next

- [ ] Run `pnpm --filter @orbii/backend exec convex dev` and point mobile at deployment URL
- [ ] Replace device-local user id with Clerk
- [ ] Expo Router screens (Today / Orbit / Settings) matching design-ideas
- [ ] Wire mobile to Convex mutations instead of AsyncStorage slice store

## Queued (V1 remainder)

- Capacity settings UI (1–5)
- Same-day rereveal polish
- Trusted-user TestFlight / Expo Go invite

## Blocked

- Convex deployment (user login): `pnpm --filter @orbii/backend dev`
- Clerk keys (deferred per DECISIONS)

## Spec pointer

`specs/2026-08-24-orbii-v1-design.md`
