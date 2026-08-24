# Writing conventions (Pedro house style)

Behavior-preserving rewrite rules. Match how hand-written code in this repo reads — blank lines, early returns, when to split a branch into a child.

These amplify `AGENTS.md` / `CLAUDE.md`. Prefer quoting those files when they conflict.

## Control flow

### Braces always

```ts
// bad
if (loading) return <Skeleton />;

// good
if (loading) {
  return <Skeleton />;
}
```

Same for `else`, `for`, `while`, `do` — including single-statement bodies.

### Blank line between sibling `if`s

Exactly **one** blank line between consecutive sibling `if` statements (same indent, not nested).

```ts
// bad
if (loading) {
  return <Skeleton />;
}
if (items.length === 0) {
  return <Empty />;
}

// good
if (loading) {
  return <Skeleton />;
}

if (items.length === 0) {
  return <Empty />;
}
```

Do **not** insert blank lines between an `if` and its related `else` / `else if`.

### Early-return `if` over nested ternaries

Loading / empty / error / success in a component return: prefer early `if` blocks, then a single happy-path return.

```tsx
// bad — nested ternary soup
return loading ? (
  <Skeleton />
) : items.length === 0 ? (
  <Empty />
) : (
  <List items={items} />
);

// good
if (loading) {
  return <Skeleton />;
}

if (items.length === 0) {
  return <Empty />;
}

return <List items={items} />;
```

### One-level ternaries are the default for a binary choice

A single `cond ? a : b` is normal TypeScript and normal React. Prefer it over `let` plus a later `if` that reassigns.

```ts
// good
const title = isList ? "Pessoas marcadas" : "Quem é essa pessoa?";

// bad — do not rewrite a one-level ternary this way
let title = "Quem é essa pessoa?";
if (isList) {
  title = "Pessoas marcadas";
}
```

```tsx
// good — one-level JSX ternary (parens around a branch are still one level)
{search ? (
  <Pressable onPress={() => onChangeSearch("")}>
    <Ionicons name="close-circle" />
  </Pressable>
) : null}

{isList ? <TaggedList tags={tags} /> : <PlayerSearch search={search} />}

// bad
let clearSearchButton = null;
if (search) {
  clearSearchButton = <Pressable>...</Pressable>;
}
```

Do **not** flag or rewrite:

- `const x = cond ? a : b`
- `{cond ? <Node /> : null}`
- `{cond ? ( <A /> ) : ( <B /> )}`
- TypeScript optional properties (`label?: string`)

If the two branches are large, either keep that **one-level** ternary or extract a child component. Do not introduce `let` + reassignment to "avoid" the ternary.

Chained / nested ternaries (`a ? b : c ? d : e`, or a ternary inside another ternary's branch) still flatten with early-return `if`s or a child component.

Leave sequential `if`s that build an object or accumulate fields (optional spreads, patch objects). Those are not a binary A-or-B choice.

## Types

### `interface` for object shapes

```ts
// bad
type Props = { title: string; onPress: () => void };

// good
interface Props {
  title: string;
  onPress: () => void;
}
```

Reserve `type` for unions, tuples, function signatures, mapped/conditional types, and aliases an interface cannot express.

Do **not** rewrite `prop?: T` into `Partial<{ prop: T }>` to dodge a ternary counter. Optional properties are not ternaries.

## Components vs functions

- PascalCase React components: `function ComponentName()` (or `export default function` / `export function`).
- Hooks, utils, handlers: `const name = () => ...` — never arrow components named PascalCase.

## When to split (writing pass)

Split a **body helper component** (same folder / nest per structural rules) when:

1. The return is **nested/chained** ternary soup, or
2. Loading / empty / list each deserve their own early-return block and the parent is only chrome + state wiring.

Many sibling one-level ternaries (`{cond ? <Section /> : null}` repeated) are fine in one return — do not extract a body just to lower a ternary count.

Do **not** invent folder trees in this skill — if atomize+nest is needed, stop and point at `structural-cleanup`. This skill rewrites **in place** (or extracts one colocated body file when nested soup forces it).

## Reference examples in the tree

Good early-return bodies (sample; prefer siblings of the file you are editing):

- Empty / loading early returns in feature `*-body.tsx` / `*-empty.tsx` files under `apps/mobile/src/components/`
- Guard-clause style in Convex helpers under `packages/backend/convex/`

Always read **1–2 sibling files** in the same folder before rewriting — local idiom beats generic advice.
