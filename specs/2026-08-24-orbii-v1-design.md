# Orbii V1 — Product & technical design

**Status:** Awaiting approval  
**Date:** 2026-08-24  
**Audience:** Product + engineering (co-found gate)

---

## Problem and audience

**Problem.** People care about more positive habits than they can honestly perform every day. Traditional habit trackers turn a rich intention set into a daily all-or-nothing checklist, so incomplete coverage feels like failure.

**Audience (V1).** The creator plus a few trusted users. Real sync and accounts; not a public App Store launch.

**Value proposition.** Orbii separates *habits you want to keep in your life* (the Orbit) from *what deserves attention today* (Today’s Orbit). Rotation is the product. Success is “Today’s Orbit complete,” not “X of N habits done.”

**Emotional goal.** Manageable, positive, low-pressure, slightly playful. Opening should feel like: “I wonder what’s in my Orbit today.” Daily show-up is expected; *which* habits stay flexible via the offer-and-pick ritual.

---

## V1 scope

### Must-have

- Auth (Clerk-class) + Convex persistence per user
- Orbit CRUD (name, glyph/icon, category); starter seeds including easy habits
- Daily loop: `idle` → `reveal` (offer) → pick ≤ capacity → `commit` → check off → `complete`
- Offer size fixed at **5** (or `min(5, orbitSize)`)
- Capacity default **2**, editable in Settings **1–5**
- Streak + days completed (see rules below)
- Same-day re-reveal before completion
- Screens: Welcome/Auth, Setup, Today, Orbit, Settings
- Mira-shaped monorepo: `apps/mobile`, `packages/backend`, `packages/tokens`
- Visual direction ported from `design-ideas/` (playful, minimal, optimistic — not space cliché, not wellness pastel)

### Explicitly deferred

- Offer-size settings (post-V1 configurability)
- Smart scheduling, target frequencies, weekday/weekend rules, travel mode
- XP, levels, achievements, unlocks
- Habit stats dashboards / charts
- Social, sharing, teams
- Push notifications / daily reminders
- Per-habit notes, timers, duration tracking
- Web app, widgets, watch apps
- Custom offline queue / full offline mode
- Analytics product

---

## Product rules (locked)

| Decision | Choice |
|----------|--------|
| Daily selection | Offer → pick up to capacity → commit → lock |
| Streak | Any local calendar day without a **completed** Orbit breaks the streak |
| Pressure valve | Choose manageable/easy habits at reveal — not “skip the day” |
| Capacity | Default 2; Settings 1–5; offer fixed at 5 |
| Day boundary | Local calendar date using user timezone in settings |
| Capacity mid-day | New capacity applies on **next reveal**, not mid-commit |
| After complete | No further reveals that calendar date |

**Streak detail**

- Streak increments only when the user fully completes a committed Orbit that day.
- At most +1 per local calendar date.
- If the previous local calendar day has no completed Orbit, the next completion sets streak to 1 (gap = break).
- Unstarted or incomplete days count as misses once the local date has rolled past.

**Selection detail (V1)**

- Near-random offer with light “underserved / not recently committed” bias.
- No frequency engine.

---

## Architecture

| Unit | Responsibility |
|------|----------------|
| `apps/mobile` | Expo Router UI. Convex via generated hooks only. |
| `packages/backend` | Schema, queries, mutations. Offer, commit, complete, streak logic. |
| `packages/tokens` | Shared color/type/spacing (from `design-ideas`). |
| Clerk | Identity; Convex maps `userId` → data. |
| `design-ideas/` | Throwaway visual/prototype reference — not imported by the app. |

**Invariant:** UI does not invent streak or offer rules. Server is source of truth for day phase and stats.

---

## Components and interfaces

### Mobile screens

- Auth / welcome  
- Setup (first Orbit; highlight easy seeds)  
- Today (`idle` \| `reveal` \| `active` \| `complete`)  
- Orbit (list / add / remove)  
- Settings (capacity 1–5; sign out)

### Convex API

| Function | Kind | Contract |
|----------|------|----------|
| `habits.list` | query | User’s Orbit |
| `habits.add` / `habits.remove` | mutation | CRUD + seed helpers |
| `settings.get` / `settings.setCapacity` | query / mutation | Capacity 1–5; timezone |
| `day.get` | query | Today’s session for local date |
| `day.startReveal` | mutation | Build offer → `reveal` |
| `day.toggleSelect` | mutation | Within capacity |
| `day.commit` | mutation | Lock → `active` |
| `day.toggleComplete` | mutation | Check off; all done → `complete` + streak |
| `day.rereveal` | mutation | Abandon incomplete same day → new offer |
| `stats.summary` | query | Streak, days completed |

### Domain types

- `Habit`: `{ id, name, glyph, category }`  
- `DayPhase`: `idle` \| `reveal` \| `active` \| `complete`  
- `DaySession`: phase, offeredIds, selectedIds, committedIds, completedIds, localDate  
- `UserSettings`: `{ capacity, timezone }`

---

## Data model and flows

### Suggested Convex tables

- `users` — profile link to auth subject; timezone; capacity; streak; daysCompleted; lastCompletedLocalDate  
- `habits` — userId, name, glyph, category, createdAt, archived?  
- `daySessions` — userId, localDate, phase, offeredIds, selectedIds, committedIds, completedIds  

(Exact field names may adjust at implementation; behavior above is normative.)

### Happy path

1. Sign in → ensure settings → if empty Orbit, Setup.  
2. Today idle → `startReveal` → offer ≤5.  
3. Select ≤ capacity → `commit` → `active`.  
4. Toggle complete until all committed done → `complete`; update streak/daysCompleted.  
5. Reopen app same day → still `complete`.

### Same-day recovery

`rereveal` from `reveal` or `active` (not `complete`): clear commit, new offer, streak unchanged until completion that day.

### Missed day

On encountering a new local date with no completed session for the previous date: streak is broken (user-visible on next completion or summary read).

---

## Error handling

- Enforce phase/capacity rules in mutations; UI disables invalid actions.  
- Empty Orbit: block reveal; send user to Setup.  
- Orbit smaller than 5: offer all; clamp capacity to orbit size at reveal.  
- Network/auth failure: non-punitive retry copy; do not invent local “complete.”  
- `rereveal` after `complete`: reject.  
- Timezone change while traveling: known V1 limitation; settings timezone is authoritative.

Copy: no “you failed.” Streak reset is neutral.

---

## External dependencies and accounts

- Node ≥20, pnpm, Turborepo  
- Expo (mobile)  
- Convex  
- Clerk (or equivalent already used in mira)  
- Design reference: existing `design-ideas/` (Outfit, OKLCH coral/mist tokens)

---

## Testing

- **Backend:** Vitest for offer/capacity clamps, phase machine, streak B, rereveal, no double-count same day.  
- **Mobile:** Manual checklist; no heavy E2E required for V1.  
- **Slice success:** New user → Orbit → full daily loop → persist across relaunch → streak correct across simulated dates in tests.

---

## Success criteria

1. Trusted users can complete a full day ritual without a giant checklist.  
2. Streak reflects daily completed Orbits (rule B), not “opened the app.”  
3. Completing Today’s Orbit feels like success even when many Orbit habits sat out.  
4. Capacity is adjustable 1–5; offer stays fixed at 5.  
5. First vertical slice runs end-to-end on device/simulator against Convex.

---

## Open questions

Resolved before implementation kickoff unless marked deferred:

| Item | Resolution |
|------|------------|
| Auth provider | Clerk (align with mira) unless setup cost blocks — then revisit |
| Exact glyph/icon system in RN | Port prototype glyphs; polish later |
| Archive vs delete habits | V1: remove is enough |
| Offer underserved algorithm | Simple bias OK; document in code, not a product surface |

No blocking TBDs for V1 build planning.

---

## Complexity

**Medium** — familiar stack, small domain; day/streak correctness needs tests.

---

## Reference

- Product principles: `design-ideas/PRODUCT.md`  
- Visual system: `design-ideas/DESIGN.md`  
- Clickable prototype: `design-ideas/` (not production)
