# Style colocation (mobile)

**Colocate** styles with the component that owns them. A central `*-styles.ts` is for **shared** keys only — styles referenced from two or more sibling files.

## Decision rule

For each style key in a feature `*-styles.ts`:

| Usage                      | Action                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------- |
| One consumer file only     | Move key into that component file (`const styles = StyleSheet.create({…})` at bottom) |
| Two or more consumer files | Keep in the shared styles file                                                        |
| No consumer (orphan)       | Delete if dead; otherwise trace before moving                                         |

When a component needs both private and shared keys, import shared styles and keep private keys inline:

```tsx
import { sharedStyles } from "./feature-shared-styles";

export default function RuleLine() {
  return <View style={sharedStyles.row}>…</View>;
}

const styles = StyleSheet.create({
  icon: { … }, // only RuleLine uses this
});
```

## Where styles live

| Artifact                       | Location                                                                 |
| ------------------------------ | ------------------------------------------------------------------------ |
| Private styles (one component) | Bottom of that `.tsx` file                                               |
| Shared styles (2+ components)  | `*-styles.ts` beside the screen or subfolder that owns the siblings      |
| Cross-feature reuse            | Rare — prefer duplicating small one-off layout over a global styles dump |

Name shared files after the **owner group**, not the whole feature tree:

- `badges/how-it-works-card.tsx` + `rule-line.tsx` both use `ruleList` → keep `ruleList` in whichever file owns the list wrapper; `ruleLine` / `ruleIcon` / `ruleText` → `rule-line.tsx`
- `rankings-private-card-shared-styles.ts` — intentional shared leaf cluster

## After colocation

- Delete emptied keys from the central file; remove the file when zero keys remain
- Update imports — no feature barrels
- Shared file keeps `theme` from `@mira/ui/native/theme`; never hardcode colors or radii
- Constants used only by one component (e.g. icon size) move with that component

## Anti-patterns

- Monolithic `feature-styles.ts` with 40+ keys after structural split
- Private styles in a separate `.ts` file one folder away from the only consumer
- Type-based `styles/` subfolders inside a feature — colocate by **component ownership**
- Splitting shared keys across files that import each other's styles
