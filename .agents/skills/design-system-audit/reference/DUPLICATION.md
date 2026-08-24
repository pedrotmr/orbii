# Duplication heuristics

## High-confidence clusters (verify in repo)

1. **Segmented controls** — `segment-control`, `animated-segmented-control`, `profile-segmented-tabs`, `rankings-chip-group`
2. **Page headers** — `fixed-page-header`, `header-toolbar`, `app-header`
3. **Web status cards** — `loading.tsx`, `error.tsx`, `WebSessionGate.tsx` share the same card shell
4. **Empty / loading states** — `ActivityIndicator` + tertiary caption text repeated across tabs
5. **Avatar + name row** — feed cards, profile hero, comment drawer headers
6. **Timestamp / meta row** — `fontSize sm` + `text.tertiary` + `fontWeight 600` (caption tertiary)

## Style fingerprint method

Normalize each style object to sorted keys with token names (not values):

`{ fontSize: "sm", fontWeight: "600", color: "text.tertiary" }`

If the same fingerprint appears in ≥2 files → candidate for `Text` variant or shared subcomponent.

## Structural duplicate signals

- Same `accessibilityRole` + icon + count label row
- Copy-pasted `Pressable` `pressed && { opacity: 0.55, transform: [{ scale: 0.9 }] }` (extract `usePressedStyle` or shared `PressableScale`)
- Identical `StyleSheet.create` blocks >8 lines with ≥90% overlap

## Extraction decision tree

```
≥3 similar call sites across apps?
├─ yes → packages/ui (+ package.json export subpath)
└─ no → ≥2 in same app?
    ├─ yes → apps/mobile/src/components/ui/ or feature folder
    └─ no → keep local; only replace with existing primitive
```

Extraction checklist:

- [ ] 2+ call sites (3+ for `packages/ui`)
- [ ] Props cover real differences; no boolean soup
- [ ] Name matches domain (`ProfileStatCard`, not `SmallCard`)
- [ ] Uses tokens / `@mira/ui` internally
- [ ] Default export function component (repo convention)

## Ripgrep helpers

```bash
# Text without variant (manual review)
rg '<Text style=' apps/mobile/src --glob '*.tsx'

# Hardcoded colors
rg '#[0-9a-fA-F]{3,8}|rgba?\(' apps/mobile/src apps/web/src --glob '*.{tsx,ts}'

# StyleSheet files count
rg -l 'StyleSheet\.create' apps/mobile/src --glob '*.tsx'

# Web repeated card shell
rg 'rounded-3xl border border-\[var\(--mira-border\)\]' apps/web/src
```
