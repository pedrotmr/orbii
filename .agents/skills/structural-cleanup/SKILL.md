---
name: structural-cleanup
description: Structural cleanup housekeeping for apps/mobile — split fat files, nest the resulting tree for legibility, thin routes, adopt layout shells, unify spacing. Use for scheduled/autonomous daily runs, structural cleanup, file organization, split large files, folder structure, thin routes, or mobile clean-code navigation.
---

# Structural Cleanup

Autonomous **housekeeping** for `apps/mobile`: one bite-sized pass per run. Splitting and folder nesting are **one workflow** — atomizing a file always lands new files in a legible tree; reorganizing a flat folder always atomizes multi-component files first.

**Legibility** goal: open a folder and know the entry, the owner, and the leaves. Routes stay **thin**; pages share **shells** and **tokens**. Move and split only — preserve exact behavior.

**Not:** feature work, dead-code removal, visual redesign (`impeccable`), or backend changes (`build-page`, `cleanup-code`).

Skill path: `.agents/skills/structural-cleanup/` (`.claude/skills/` is a symlink). Reference docs live in [`reference/`](reference/).

## Scope

**In:** `apps/mobile/src/components/**`, `apps/mobile/src/app/**`, import fixes in touched tests.

**Out:** `vendor/`, `screens-design/`, generated paths, `*.test.*` as primary target, `packages/backend/convex/` unless user names a file, logic changes, dedup-by-refactor, feature-level barrels, commits unless asked.

**One area per run** — fully atomized, nested, shell-aligned, then stop. An area is a file plus its feature folder when both need work.

## Target selection

**Default (automation / recurring):**

```bash
node .agents/skills/structural-cleanup/scripts/pick-target.mjs --random
```

**Manual / highest-debt:**

```bash
node .agents/skills/structural-cleanup/scripts/pick-target.mjs
```

**Diagnostics only** (list rankings, don't pick):

```bash
node .agents/skills/structural-cleanup/scripts/find-split-target.mjs
node .agents/skills/structural-cleanup/scripts/find-folder-debt.mjs
```

Use the script output `PICK` and `FOLDER SCOPE` unless the user named a file or folder. The `--random` pool spreads housekeeping across the codebase over time — do not always pick #1.

## One pass (split + nest together)

Every run applies **all** of the following to the picked area — never split without nesting, never nest without checking for inline components:

1. **Atomize** — every uppercase `function` component → own file ([reference/FOLDER-CONVENTIONS.md](reference/FOLDER-CONVENTIONS.md))
2. **Nest** — new and existing siblings into subfolders that mirror the component tree
3. **Thin route** — if target is under `app/`, leave ~20–40 lines of wiring
4. **Shell** — adopt existing layout shell where chrome is duplicated ([reference/LAYOUTS.md](reference/LAYOUTS.md))
5. **Spacing** — tokenize ad-hoc padding/margin; extract duplicated styles in the feature
6. **Colocate styles** — private keys beside their component; shared keys only in `*-styles.ts` ([reference/STYLES-COLLOCATION.md](reference/STYLES-COLLOCATION.md))

Direct imports only — no feature-level barrels.

Mobile tests belong in a `__tests__/` folder beside the source file or source folder they cover. Component `index.ts` barrels and one-line forwarding files are prohibited; only Expo Router's URL-defining `app/**/index.tsx` route entries remain.

## Workflow

### 1. Audit

Read `PICK`, `FOLDER SCOPE`, the target file, and the feature folder. Map:

- Every uppercase `function` component (including unexported helpers)
- Folder shape vs [reference/FOLDER-CONVENTIONS.md](reference/FOLDER-CONVENTIONS.md)
- Shell fit vs [reference/LAYOUTS.md](reference/LAYOUTS.md)
- Spacing debt vs sibling screens
- Style keys in a central `*-styles.ts` that belong to a single new/existing component (colocate vs keep shared)

**Completion:** every component, every subfolder to create, and every private style key destination is listed — nothing skipped because "we're only splitting" or "only nesting."

### 2. Plan

List every file path before editing — splits, moves, route thins, shell wraps, token swaps, style colocations.

**Completion:** plan covers every item from the audit.

### 3. Execute

Follow the **one pass** steps above in order.

**Completion:** zero uppercase components remain in the target; the folder has an obvious named entry and nested children; imports name concrete files; route (if any) is thin and is not a re-export.

### 4. Gates

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm --filter @mira/mobile test   # when app/ or components/ touched
```

Fix import paths only.

**Completion:** format, lint, typecheck green; tests PASS or SKIPPED with reason.

### 5. Split Report

- **Target** / **Trigger** (`pick-target --random` | `pick-target` | user override)
- **Tree** — before/after folder shape (indented)
- **Atomized** — new files, source lines
- **Nested** — moves into subfolders
- **Shell / spacing / colocated styles** — changes made
- **Updated imports**
- **Route changes** (if any)
- **Gates** — format / lint / typecheck / tests: PASS | FAIL | SKIPPED
- **Deferred** — next pool entry from `pick-target.mjs`

## Anti-patterns

Treating split and nest as separate modes; behavior or UI changes; removing code; multiple areas per run; atomizing without nesting; nesting without atomizing inline components; dumping all styles into one `*-styles.ts` when keys are single-consumer; feature barrels; hooks/utils before components.

## Automation prompt

Use this for scheduled runs (once or twice daily):

```
Structural cleanup (housekeeping)

Run the structural-cleanup skill autonomously. Pick target with:
  node .agents/skills/structural-cleanup/scripts/pick-target.mjs --random

One area, one full pass: atomize + nest + thin route + shell + spacing + colocate private styles. No behavior changes.
Do not commit unless configured to. Gates: format, lint, typecheck, mobile tests if touched.
End with Split Report.
```
