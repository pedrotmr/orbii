# Layout shells & spacing (mobile)

During structural cleanup, converge duplicate page chrome onto existing **shells** and **tokens**. No visual redesign — same pixels, shared boundaries.

## Shell catalog

Pick the shell the screen already behaves like. Do not invent a third header pattern.

| Shell                    | Path                                                    | Use when                                                                                                                     |
| ------------------------ | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **SubpageScreen**        | `components/navigation/subpage-screen.tsx`              | Stack subpage with back chevron + centered title. `bodySurface="page"` for feed-style lists; `"canvas"` for form/card bodies |
| **GradientHeaderScreen** | `components/animated-screen/gradient-header-screen.tsx` | Tab-root or profile-style pages with gradient header + scroll body                                                           |
| **TabPlaceholderScreen** | `components/navigation/tab-placeholder-screen.tsx`      | Placeholders only — not a target for real screens                                                                            |
| **CreateFlowScreen**     | `components/create-flow/create-flow-screen.tsx`         | Full-screen modal composer (`/create`)                                                                                       |

Before extracting inline header/back/padding from a file, check whether it should wrap in an existing shell instead.

## Spacing debt (unify, don't redesign)

Replace ad-hoc numbers with tokens from `@mira/ui/native/theme`:

| Concern                  | Token                                                                |
| ------------------------ | -------------------------------------------------------------------- |
| Horizontal screen gutter | `theme.layout.screenPadding`                                         |
| Section gaps             | `theme.spacing[3]` – `theme.spacing[6]`                              |
| List bottom inset        | `theme.spacing[12]` or tab-bar-aware padding from an existing screen |
| Card internal padding    | match sibling screens in the same feature                            |

**Legwork:** grep the feature folder for raw numbers in `StyleSheet` and `padding`/`margin`. Align each to the nearest existing screen in the same area (e.g. other `SubpageScreen` lists use the same `contentContainerStyle`).

Extract repeated `contentContainerStyle` objects into the feature's `-styles.ts` or `-utils.ts` when two+ files in the feature duplicate the same object.

## Empty & loading states

Prefer `@mira/ui/native/empty-state` and existing skeleton components in the feature. Extract inline empty UI into `<feature>-empty.tsx` or `<screen>-skeleton.tsx` leaves under the screen subfolder.

## Out of scope here

- New shells or changing shell APIs → feature work, not structural cleanup
- Color, typography, or component redesign → `impeccable` / `build-page`
- Backend or data-layer changes
