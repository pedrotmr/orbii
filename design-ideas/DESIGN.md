# Design System

## Product overview

Orbii separates habits you want in your life from what deserves attention today.
The prototype visual system supports a daily loop: reveal options → commit → ritual list → complete.

## Visual theme

**Mood:** Morning kitchen light through frosted glass — cool mist atmosphere, coral spark of commitment.

**Strategy:** Restrained product UI with a Committed coral moment on reveal selection and day completion.

**Theme:** Light, atmospheric (Copilot-like soft shade pools). Never blank white. Never gaudy gradients. Never literal space/planet chrome.

**Home chrome:** Ritual list (probe A) — calm rows, soft glass panels, quiet brand mark.

**Action state:** Reveal (probe D energy) — denser atmosphere, offer cards, ceremonial Start today.

## Colors (OKLCH)

| Token | Role |
|-------|------|
| `--bg` / `--bg-mid` / `--bg-deep` | Cool mist stage + in-phone wash |
| `--surface` / `--surface-raised` | Panels, rows, frosted controls |
| `--ink` / `--muted` | Primary and secondary text |
| `--primary` | Coral commitment / completion |
| `--accent` | Teal secondary (chips, orbit accents) |
| `--success` | Soft done state wash |

Accent usage ≤10% except on reveal/complete climaxes.

## Typography

- **Family:** Outfit (400–700)
- **Scale:** Fixed rem — xs 0.75 · sm 0.875 · md 1 · lg 1.125 · xl 1.35 · 2xl 1.65 · 3xl 2
- **Headings:** 700, letter-spacing −0.03em, tight leading
- **Body:** 400/500, muted for supporting copy

## Components

- `Button` — primary / secondary / accent / ghost
- `HabitRow` — check, select, static modes
- `OfferCard` — reveal selection
- Chips, stat pills, segmented controls, nav tabs, empty panel
- `PhoneFrame` — prototype device chrome with mood atmospheres

## Layout

- Phone-first prototype shell (~390×844) on an atmospheric stage
- Screens: welcome, setup, today (idle/reveal/active/complete), orbit, settings
- Full-page design system explorer at `/design-system`

## Motion

- Product timing 150–220ms; reveal stagger ~50ms; completion spring
- Atmosphere mood shifts with phase (default / reveal / celebrate)
- `prefers-reduced-motion` zeroes duration tokens

## Prototype routes

| Route | Purpose |
|-------|---------|
| `/` | Welcome |
| `/orbit/setup` | Build Orbit |
| `/today` | Daily loop |
| `/orbit` | Full Orbit list |
| `/settings` | Capacity, offer size, demo reset |
| `/design-system` | Token & component lab |
