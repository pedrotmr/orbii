# Folder conventions (mobile)

The goal is **legibility**: open a folder and immediately know the entry point, what belongs to what, and where to add the next file.

## Roles at a glance

| Role               | Location                       | Naming                                          | Contents                                             |
| ------------------ | ------------------------------ | ----------------------------------------------- | ---------------------------------------------------- |
| **Route**          | `app/(app)/.../*.tsx`          | matches URL segment                             | wiring only — params, queries, navigation            |
| **Screen**         | `components/<feature>/`        | `<screen-name>-screen.tsx`                      | composes children; owns loading/empty/error branches |
| **Section**        | nested under its screen        | `<screen>-<section>.tsx`                        | one logical block of the screen (hero, list, form)   |
| **Leaf**           | nested under section or screen | kebab-case noun                                 | card, row, skeleton, empty state, button group       |
| **Shared feature** | feature root                   | `<feature>-styles.ts`, `-types.ts`, `-utils.ts` | styles/types/utils used by multiple siblings         |

## Nesting rules

**Flat is a smell.** When a feature folder has **5+ `.tsx` files at the same level**, nest before adding more:

```
components/profile/
  profile-main-view.tsx          # screen
  profile-hero.tsx               # section (profile-main-view child)
  profile-stat-card.tsx          # leaf (profile-hero child)
  liked-feed/
    liked-feed-screen.tsx        # screen (extracted from route)
    liked-feed-list.tsx          # section
    liked-feed-skeleton.tsx      # leaf
    liked-history-empty.tsx      # leaf
```

Pick nesting by **ownership**, not alphabet:

- `liked-feed-*` files belong under `liked-feed/` because they serve that screen.
- `profile-hero` stays beside `profile-main-view` only while the folder stays legible; move under `profile-main-view/` if the flat list grows.

**Subfolders mirror the component tree**, not arbitrary grouping. A folder name answers: "child of what?"

**Screen children do not sit flat beside the screen.** A screen folder contains its named `*-screen.tsx` entry plus ownership subfolders for child sections, lists, navigation, chrome, and states. A single-file ownership folder is acceptable when it keeps that screen tree obvious. Outside a screen tree, avoid folders that add depth without clarifying ownership.

## Index and forwarding files

- Do not add `index.ts` barrels under `components/`; import the concrete file directly.
- Expo Router's URL-defining `app/**/index.tsx` files are the only exception. They declare a named route component instead of re-exporting or aliasing another component.
- Do not create one-line forwarding files that only re-export a component under another path.
- **Route files are the app index** — they should stay thin; the screen body lives in `components/`.

## Splitting (atomize)

Every uppercase `function` component → its own file. No exceptions for "private" helpers (`LikedFeedList`, `CommentSeparator`).

After atomizing, **relocate** each new file into the subfolder that matches its parent in the tree. Splitting without nesting recreates the flat-list problem.

## Co-location

| Artifact                     | Where                                                                 |
| ---------------------------- | --------------------------------------------------------------------- |
| Styles used by one component | Bottom of that `.tsx` (`const styles = StyleSheet.create`)            |
| Styles shared by 2+ siblings | `*-styles.ts` beside the screen or subfolder that owns those siblings |
| Types/utils for one screen   | beside that screen                                                    |
| Types/utils for the feature  | `<feature>-types.ts`, `<feature>-utils.ts` at feature root            |

**Colocate by default.** A feature-root `badges-styles.ts` with 40+ keys is a smell — most keys should live in the component file after atomizing. Run `collocate-styles` to split existing monoliths. See [STYLES-COLLOCATION.md](STYLES-COLLOCATION.md).

## Anti-patterns

- Ten `.tsx` files in one folder with no hierarchy
- Route file containing JSX sections, lists, or cards
- Screen file containing leaf components that never render elsewhere
- Nesting by type (`components/`, `hooks/`, `styles/` subfolders inside a feature) — nest by **UI ownership** instead
- Any barrel or forwarding file that hides the concrete import path
- A screen file listed flat beside its child sections or states
