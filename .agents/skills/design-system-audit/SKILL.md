---
name: design-system-audit
description: Design system audit for Mira La Cancha — style debt and duplicated UI replaced with @mira/ui, @mira/tokens, or extracted components. Use when cleaning styles, consolidating duplicated blocks, migrating StyleSheet/Tailwind to Text variant/tone, or checking reuse against existing primitives.
---

# Design System Audit

One **folder** per run. Find **style debt**; **triage** each finding to a **verdict**; apply **drop-in** replacements. Consolidate styling only — no behavior changes.

Skill path: `.agents/skills/design-system-audit/` (`.claude/skills/` is a symlink). Reference docs live in [`reference/`](reference/).

## Scope

| Layer             | Location                                   | Prefer                                                |
| ----------------- | ------------------------------------------ | ----------------------------------------------------- |
| Shared primitives | `packages/ui/src/native/*`                 | `Text`, `Button`, `Card`, `Screen`, …                 |
| Tokens            | `packages/tokens`, `@mira/ui/native/theme` | `theme.colors.*`, `theme.spacing[*]`, `theme.radii.*` |
| App components    | `apps/mobile/src/components/**`            | Reuse before creating new                             |
| Web               | `apps/web/src/**`                          | `@mira/tokens/tailwind-preset` + semantic classes     |

**Out:** `apps/mobile/src/vendor/**` unless the user explicitly includes vendor code.

## Target selection

**Always run first — do not ask the user.** From repo root:

```bash
node .agents/skills/design-system-audit/scripts/audit-styles.mjs
```

Use **By folder** to pick **one parent folder** (e.g. `apps/mobile/src/components/feed`, `apps/web/src/app/(app)`). Scoped detail:

```bash
node .agents/skills/design-system-audit/scripts/audit-styles.mjs --path <chosen-folder>
```

**Pick rules:** one folder only; prefer highest score with drop-in replacements; tie-break `components/<feature>/` over loose `app/` files. User-named folder overrides script ranking.

## Workflow

### 1. Audit

Group every finding **within the chosen folder**:

| Category                 | Signal                                                           |
| ------------------------ | ---------------------------------------------------------------- |
| **A — Text**             | `<Text style={...}>` matching a `variant` + `tone`               |
| **B — Surface/layout**   | `StyleSheet` blocks matching `Card`, `Screen`, `Button`, shadows |
| **C — Token violations** | Hardcoded hex/rgba, magic spacing/radii not from `theme`         |
| **D — Duplication**      | Same JSX structure or style fingerprint in 2+ files              |

Consult [reference/MAPPINGS.md](reference/MAPPINGS.md) for A/B/C; [reference/CATALOG.md](reference/CATALOG.md) for existing primitives; [reference/DUPLICATION.md](reference/DUPLICATION.md) for D.

**Completion:** every script finding and every manual duplicate in the folder is listed under A–D — nothing skipped.

### 2. Triage

For each finding, assign a **verdict**:

| Verdict     | Action                                                                          |
| ----------- | ------------------------------------------------------------------------------- |
| **Drop-in** | Replace with existing primitive; delete unused style key                        |
| **Extend**  | Add `variant`/`tone` or prop to `@mira/ui` if 3+ call sites need it             |
| **Extract** | New component in `apps/mobile/src/components/ui/` or `packages/ui` if cross-app |
| **Keep**    | One-off (overlay text shadow, animation, media-specific layout) — note why      |

**Completion:** every audited item has a verdict; Drop-in items have a concrete replacement named.

### 3. Apply

Only the folder picked in target selection. Per file:

1. Replace primitives per [reference/MAPPINGS.md](reference/MAPPINGS.md)
2. Remove dead `StyleSheet` keys
3. Gate:

```bash
pnpm lint && pnpm typecheck
```

**Completion:** every Drop-in and Extend item in scope is applied; dead styles removed; gates green.

### 4. Audit Report

| File                  | Finding           | Suggestion                               | Verdict |
| --------------------- | ----------------- | ---------------------------------------- | ------- |
| `mural-post-card.tsx` | `timestamp` style | `Text variant="caption" tone="tertiary"` | Drop-in |

Include **Extract** follow-ups (suggested path + props) and **next folder** (runner-up from By folder ranking).

**Completion:** report covers every finding from step 1 — applied, deferred, or kept with reason.

## Anti-patterns

- Replacing styles that need `textShadow`, gradient overlays, or inverse-on-media with wrong variant
- Moving one-off layout to `packages/ui` prematurely
- Barrel exports in `@mira/ui` (use `@mira/ui/native/<component>` subpaths)
- Changing copy, spacing feel, or touch targets without user approval

## Automation prompt

```
Design system audit (recurring)

Run the design-system-audit skill. Pick one parent folder from the script's By folder ranking; triage and apply only there.

Skip vendor/; no visual behavior changes; delete dead StyleSheet keys.
Gates: pnpm lint && pnpm typecheck. Do not commit unless I ask.
End with Audit Report: chosen folder, summary table, Extract follow-ups, next folder.
```
