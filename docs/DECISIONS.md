# Decision log

ADR-lite. Newest entries at the top.

---

## 2026-08-24 — Device-local user id for vertical slice (Clerk next)

**Context:** Spec locks Clerk for multi-user sync, but Clerk + Convex project credentials block a same-day end-to-end slice.

**Chosen:** V1 slice authenticates with a stable `clientUserId` stored in AsyncStorage on device. Convex functions take that id (validated string). Clerk remains the production path; swap identity source without changing ritual tables.

**Rejected:** Block bootstrap until Clerk keys exist; fake-complete days only on device with no Convex.

**Consequences:** Friends on two devices are separate users until Clerk. Do not ship TestFlight like this without replacing identity.

---

## 2026-08-24 — Capacity editable 1–5; offer fixed at 5

**Context:** Strong users may want capacity up to 5; offer-size knobs add settings noise.

**Chosen:** Default capacity 2, Settings 1–5; offer always 5 (or min(5, orbit size)).

**Rejected:** Max capacity 3; expose offer size in V1; capacity locked at 2.

**Consequences:** Post-V1 can add offer-size settings. Offer must always be ≥ capacity at reveal (clamp capacity to orbit size).

---

## 2026-08-24 — Streak rule B (daily completed Orbit required)

**Context:** Offer-and-pick already lets users choose easy habits; “pause days” undercut the daily ritual.

**Chosen:** Any local calendar day without a completed Orbit breaks the streak. Pressure valve = pick manageable habits, not skip the day.

**Rejected:** Unstarted days pause streak; streak on commit only; no streaks in V1.

**Consequences:** Setup must seed easy habits. Copy for reset stays neutral, not shameful.

---

## 2026-08-24 — Offer → pick → commit (not auto-assign)

**Context:** Pure auto-assign needs skip UX immediately; pure “pick any count” muddies completion.

**Chosen:** Offer ~5, pick up to capacity, lock for the day; same-day rereveal before complete.

**Rejected:** Auto-assign N; free-form pick count with no capacity.

**Consequences:** Favorite-bias can starve rotation; light underserved bias only in V1 — no smart scheduler.

---

## 2026-08-24 — Mira-shaped monorepo, mobile-only

**Context:** Creator already uses Mira (Expo + Convex + pnpm turborepo).

**Chosen:** `apps/mobile`, `packages/backend`, `packages/tokens`; no `apps/web` in V1.

**Rejected:** Single Expo app without workspaces; evolve Vite prototype into production.

**Consequences:** Slightly more scaffold; cleaner path to web later.
