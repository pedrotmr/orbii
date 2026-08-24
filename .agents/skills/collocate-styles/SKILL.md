---
name: collocate-styles
description: Collocate mobile styles — split fat *-styles.ts files by moving private keys beside their component; keep shared keys in the styles file. Use for collocate styles, style colocation, split styles file, decentralize styles, or autonomous style cleanup runs.
---

# Collocate Styles

Autonomous **housekeeping** for `apps/mobile`: one styles file per run. Move **private** style keys into the component that owns them; leave **shared** keys in `*-styles.ts`.

**Colocation** goal: open a component and see its layout beside its JSX. Central style files hold only keys used by two or more siblings.

**Not:** visual redesign (`impeccable`), structural file splits (`structural-cleanup`), token changes, or behavior edits.

Skill path: `.agents/skills/collocate-styles/` (`.claude/skills/` is a symlink). Rules: [`reference/STYLES-COLLOCATION.md`](reference/STYLES-COLLOCATION.md).

## Scope

**In:** `apps/mobile/src/components/**/**/*-styles.ts`, touched `.tsx` consumers, import fixes in related tests.

**Out:** inline `StyleSheet.create` already in components (no-op), `packages/`, generated paths, commits unless asked.

**One styles file per run** — fully audited, private keys moved, shared file trimmed, then stop.

## Target selection

**Default (automation):**

```bash
node .agents/skills/collocate-styles/scripts/pick-target.mjs --random
```

**Manual / highest debt:**

```bash
node .agents/skills/collocate-styles/scripts/pick-target.mjs
```

**Diagnostics only:**

```bash
node .agents/skills/collocate-styles/scripts/find-style-debt.mjs
```

Use script output `PICK` and `FOLDER SCOPE` unless the user named a styles file. `--random` spreads work across the pool — do not always pick #1.

## One pass

1. **Map** — every style key → consumer file(s); tag private (1 file) vs shared (2+)
2. **Move** — each private key → `StyleSheet.create` at bottom of its owner `.tsx`
3. **Trim** — remove moved keys from `*-styles.ts`; delete file if empty
4. **Imports** — drop unused style imports; keep shared import where needed

Direct imports only — no barrels.

## Workflow

### 1. Audit

Read `PICK`, `FOLDER SCOPE`, the styles file, and every importer in the feature folder.

For each key, record owner file(s). Cross-check with grep — script hints are not exhaustive.

**Completion:** every key is tagged `private → <file>` or `shared` or `orphan` (with resolution).

### 2. Plan

List each key's destination before editing.

**Completion:** plan covers every key from the audit; shared keys explicitly stay.

### 3. Execute

Follow the **one pass** steps. Prefer bottom-of-file `const styles = StyleSheet.create` in `.tsx` (existing convention in `create-flow/`, `ui/`).

**Completion:** no private key remains in the central file; each moved key lives beside its component.

### 4. Gates

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm --filter @mira/mobile test   # when components/ touched
```

**Completion:** format, lint, typecheck green; tests PASS or SKIPPED with reason.

### 5. Colocation Report

- **Target** / **Trigger** (`pick-target --random` | `pick-target` | user override)
- **Moved** — key → component file
- **Kept shared** — keys remaining in `*-styles.ts` and why (consumer list)
- **Removed** — empty keys / deleted style file
- **Updated imports**
- **Gates** — format / lint / typecheck / tests: PASS | FAIL | SKIPPED
- **Deferred** — next pool entry from `pick-target.mjs`

## Anti-patterns

Moving shared keys to one "primary" consumer; leaving private keys in central file; creating new `*-styles.ts` per component when keys are shared; hardcoded colors; multiple style files per run; behavior or layout changes.

## Automation prompt

```
Collocate styles (housekeeping)

Run the collocate-styles skill autonomously. Pick target with:
  node .agents/skills/collocate-styles/scripts/pick-target.mjs --random

One styles file, one full pass: map → move private → trim shared file.
No visual or behavior changes. Do not commit unless configured.
Gates: format, lint, typecheck, mobile tests if touched.
End with Colocation Report.
```
