---
name: house-style
description: Rewrite code to match Mira house writing style — early-return if blocks for nested ternary soup, one-level ternaries for binary choices, blank line between sibling ifs, control-flow braces, interface over type object shapes. Use for house-style, house style pass, ternary cleanup, formatting voice, replicate how I write, or autonomous house-style cleanup runs.
---

# House Style

Autonomous **housekeeping** that rewrites code to match **how this repo is written** — blank lines, early returns, when to split a branch — without changing behavior.

**Voice** goal: AI output should read like the hand-written siblings beside it. Prefer early-return `if` blocks over **nested** ternary soup; keep **one-level** ternaries (`cond ? a : b`, `{cond ? <Node /> : null}`); leave one blank line between sibling `if`s; always brace control flow; use `interface` for object shapes.

**Not:** file/folder atomize+nest (`structural-cleanup`), smell/deslop (`cleanup-code`), style-token reuse (`design-system-audit` / `collocate-styles`), or feature work.

Skill path: `.agents/skills/house-style/` (`.claude/skills/` is a symlink). Rules: [`reference/WRITING-CONVENTIONS.md`](reference/WRITING-CONVENTIONS.md).

## Scope

**In:** `apps/mobile/src/components/**`, `apps/mobile/src/app/**`, `packages/backend/convex/**` (non-generated), import fixes in touched tests.

**Out:** `vendor/`, `_generated/`, `screens-design/`, `*.test.*` as primary target, behavior changes, folder moves, commits unless asked.

**One file (plus optional colocated body extract) per run** — rewrite, gate, stop.

## Target selection

**Default (automation / recurring):**

```bash
node .agents/skills/house-style/scripts/pick-target.mjs --random
```

**Manual / highest debt:**

```bash
node .agents/skills/house-style/scripts/pick-target.mjs
```

**Diagnostics only:**

```bash
node .agents/skills/house-style/scripts/find-house-style-debt.mjs
```

Use script output `PICK` and `FOLDER SCOPE` unless the user named a file. `--random` spreads work across the pool — do not always pick #1.

## One pass

1. **Read siblings** — open 1–2 neighboring files in `FOLDER SCOPE` for local idiom
2. **Brace** — add `{}` to braceless `if` / `else` / loops
3. **Space** — one blank line between consecutive sibling `if`s
4. **Early return** — replace **nested/chained** JSX ternaries (loading/empty/error soup) with `if` blocks
5. **One-level ternaries** — keep `const title = isList ? "A" : "B"` and `{search ? <Clear /> : null}`. Do **not** rewrite those into `let` + `if` reassignment. If a binary `let` + `if` is already there, restore the ternary (or extract a child when the branches are whole screens)
6. **Types** — `type Name = { ... }` object shapes → `interface Name { ... }` when faithful

Preserve exact behavior and UI.

## Workflow

### 1. Audit

Read `PICK`, `FOLDER SCOPE`, the target file, and 1–2 siblings. List every:

- Nested / chained ternary (`a ? b : c ? d : e`, or a ternary inside another ternary's branch)
- Binary `let x = a; if (cond) { x = b; }` that should be a one-level ternary
- Braceless control-flow
- Sibling `if` missing a blank line
- `type {}` object alias
- PascalCase arrow component

Do **not** list one-level ternaries, `{cond ? (jsx) : null}`, or TypeScript `prop?:` as debt.

**Completion:** every debt item from the script reasons (+ any manual finds) is listed.

### 2. Plan

List edits before writing — brace/spacing/early-return/type swaps, ternary restorations, and whether a body extract is required for nested soup.

**Completion:** plan covers every audit item; no folder renames.

### 3. Execute

Apply the **one pass** steps. Follow [`reference/WRITING-CONVENTIONS.md`](reference/WRITING-CONVENTIONS.md).

If the file also needs multi-component atomize + nest, **stop after writing fixes you can do in place** and note `structural-cleanup` for the rest — do not half-run that skill here.

**Completion:** script reasons for this file are cleared or explicitly deferred with why.

### 4. Gates

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm --filter @mira/mobile test   # when apps/mobile touched
pnpm --filter @mira/backend test  # when packages/backend touched
```

**Completion:** format / lint / typecheck green; tests PASS or SKIPPED with reason.

### 5. House Style Report

- **Target** / **Trigger** (`pick-target --random` | `pick-target` | user override)
- **Siblings read**
- **Rewrites** — braces / blank lines / early returns / one-level ternaries restored / types / body extract
- **Deferred** — structural-cleanup or other skill handoff
- **Gates** — format / lint / typecheck / tests: PASS | FAIL | SKIPPED
- **Next** — next pool entry from `pick-target.mjs`

## Anti-patterns

Changing behavior or visuals; moving files into new folder trees; always picking #1 on automation runs; rewriting without reading siblings; inventing abstractions; running `cleanup-code` smell passes under this name; dumping multiple files' worth of work in one run.

**Wrong fix:** rewriting a one-level ternary into `let` + `if` reassignment to "avoid ternaries" or to clear a fake ternary-count budget. One-level ternaries are the house style.

## Automation prompt

```
House style (housekeeping)

Run the house-style skill autonomously. Pick target with:
  node .agents/skills/house-style/scripts/pick-target.mjs --random

One file, one full pass: braces, sibling-if blank lines, early-return over nested ternary soup, restore one-level ternaries (never let+if for a binary choice), interface over type {}. No behavior changes.
Do not commit unless configured to. Gates: format, lint, typecheck, relevant tests.
End with House Style Report.
```
