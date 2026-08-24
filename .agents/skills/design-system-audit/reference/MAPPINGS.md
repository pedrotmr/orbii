# Style mappings

Source of truth for mobile text: `packages/ui/src/native/text.tsx`

## Text variant mapping (mobile)

| Pattern in StyleSheet                                                                              | Replace with                               |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `fontSize: theme.typography.fontSize.sm`, `fontWeight: "600"`, `color: theme.colors.text.tertiary` | `<Text variant="caption" tone="tertiary">` |
| Same but `text.secondary`                                                                          | `tone="secondary"`                         |
| Same but `text.primary`                                                                            | `tone="primary"`                           |
| `fontSize: theme.typography.fontSize.md`, `fontWeight: "500"`, primary color                       | `variant="body"` (default tone)            |
| `fontSize: theme.typography.fontSize.lg`, `fontWeight: "700"`                                      | `variant="subtitle"`                       |
| `fontSize: theme.typography.fontSize["3xl"]`, `fontWeight: "700"`, tight tracking                  | `variant="title"`                          |
| `fontSize: 10`, `fontWeight: "600"`, `textTransform: "uppercase"`, wide letterSpacing              | `variant="meta"`                           |
| `fontSize: theme.typography.fontSize.xs`, uppercase, letterSpacing ~2.8                            | `variant="eyebrow"`                        |
| `color: theme.colors.brand.primary` on caption-sized text                                          | `variant="caption" tone="brand"`           |
| `color: theme.colors.accent.error`                                                                 | `tone="error"`                             |
| `color: theme.colors.text.inverse` on caption                                                      | `variant="caption" tone="inverse"`         |

**Partial overrides:** if only `fontWeight: "800"` differs on body text, use `variant="body"` + `style={{ fontWeight: "800" }}` or nested `<Text style={{ fontWeight: "800" }}>` inside body (see `mural-post-card` `authorInline`).

**Do not replace:** overlay text with `textShadow`, opacity tricks on inverse media, or non-token font sizes.

### Tone quick reference

| `theme.colors.text.*` | `tone`      |
| --------------------- | ----------- |
| `primary`             | `primary`   |
| `secondary`           | `secondary` |
| `tertiary`            | `tertiary`  |
| `inverse`             | `inverse`   |
| `brand.primary`       | `brand`     |
| `accent.error`        | `error`     |
| `accent.success`      | `success`   |

## Web Tailwind mapping

| Tailwind-ish pattern                                                           | Mobile equivalent                 |
| ------------------------------------------------------------------------------ | --------------------------------- |
| `text-sm font-semibold text-text-tertiary`                                     | `caption` + `tertiary`            |
| `text-sm leading-6 text-[var(--mira-text-muted)]`                              | `caption` or `body` + `secondary` |
| `text-2xl font-bold`                                                           | `title`                           |
| `text-sm font-semibold uppercase tracking-[0.24em] text-[var(--mira-primary)]` | `eyebrow` or `meta` + `brand`     |
| `rounded-3xl border … bg-white shadow-[var(--mira-shadow-card)]`               | `Card variant="raised"`           |

Never hardcode colors on web — use preset tokens (`text-text-tertiary`, `bg-surface-card`, or `var(--mira-*)`).

## Surface & layout patterns

| StyleSheet pattern                                                                                                | Primitive                            |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `backgroundColor: theme.colors.surface.card`, `borderRadius: theme.radii.lg`, `padding: theme.spacing[6]`, shadow | `Card`                               |
| `backgroundColor: theme.colors.surface.canvas` full screen                                                        | `Screen` or page wrapper             |
| `minHeight: 58`, brand fill, `borderRadius: theme.radii["2xl"]`                                                   | `Button variant="primary" size="lg"` |
| `flexDirection: "row"`, `gap: theme.spacing[6]`, heart/chat icons                                                 | Extract `PostActionBar` if 3+ feeds  |

**Replacement rule:** prefer `variant` + `tone` on `@mira/ui/native/text` `Text`. Only pass `style` for layout-only overrides (`flex`, `flexShrink`) or truly unique effects.
