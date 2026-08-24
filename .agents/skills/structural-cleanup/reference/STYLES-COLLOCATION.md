# Style colocation (structural cleanup)

When atomizing or extracting styles during structural cleanup, **colocate** private keys — do not grow a monolithic `*-styles.ts`.

Full rules: [`../../collocate-styles/reference/STYLES-COLLOCATION.md`](../../collocate-styles/reference/STYLES-COLLOCATION.md).

## Quick rule

| Style key used by    | Put it in                                                                   |
| -------------------- | --------------------------------------------------------------------------- |
| One component only   | That component's `.tsx` (`const styles = StyleSheet.create` at file bottom) |
| Two or more siblings | Shared `*-styles.ts` for that screen/subfolder                              |

## During a split

- New leaf component → move its keys out of the parent screen's styles file into the new file
- New subfolder screen → shared keys for that folder stay in `<subfolder>-styles.ts`, not the feature root
- Do **not** create `*-styles.ts` for a component that is the sole consumer of every key

## After cleanup

If a central styles file is mostly private keys, note it in the Split Report as **deferred** → `collocate-styles` skill.
