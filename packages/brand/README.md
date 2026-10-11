# `@orbii/brand`

Canonical Orbii artwork follows Mira La Cancha's `packages/brand` layout.
The creator's Apple Icon Composer document is preserved as `icon/orbii.icon`,
including its TEST ribbon, light/dark artwork, materials, and shadows.

| Canonical file                                   | Mobile copy / use                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------- |
| `icon/orbii.icon/`                               | `assets/orbii.icon/` — native iOS icon, all app variants                  |
| `png/icon-1024.png`                              | `assets/icon.png` — opaque generic / Android fallback                     |
| `png/adaptive-icon.png`                          | `assets/adaptive-icon.png` — composed tile inset into Android's safe zone |
| `png/monochrome-icon.png`                        | `assets/android-icon-monochrome.png` — silhouette of the SVG mark         |
| `png/splash-logo.png`                            | `assets/splash-icon.png` — static light launch logo                       |
| `png/splash-logo-dark.png`                       | `assets/splash-icon-dark.png` — static dark launch logo                   |
| `png/icon-dark-1024.png`                         | Dark Composer preview                                                     |
| `png/apple-touch-icon.png`, `png/favicon-32.png` | Same raster filenames as Mira; favicon copied to `assets/favicon.png`     |
| `svg/return-loop*.svg`                           | `assets/brand/` — transparent logo masters                                |
| `animations/return-loop-splash-*`                | `assets/brand/animations/` — editable JSON and dotLottie                  |

## Generate and synchronize

Requires macOS with full Xcode / Icon Composer selected by `xcode-select`, Node
matching the repository's engine, and ImageMagick plus librsvg:

```bash
brew install imagemagick librsvg
pnpm brand:generate
```

To import a new document, pass its **directory**, including the `.icon` suffix:

```bash
pnpm brand:generate "/Users/you/Downloads/Untitled.icon"
```

The import replaces the canonical bundle and then regenerates and synchronizes
the mobile copies. Edit `packages/brand/icon/orbii.icon` in Icon Composer for
later changes, then run the command without an argument. Downloads is never a
build dependency. `ICTOOL_PATH` can override automatic Xcode tool discovery.

Apple's `ictool` renders the actual document with the iOS 26 design generation
pinned in `brand.config.json`, so newer Xcode installations do not silently
change the material effects. ImageMagick creates the raster sizes and inset
adaptive foreground. librsvg renders the separate SVG splash masters correctly,
including the ring's dashed stroke and round caps. The OS splash remains static;
the app then plays the themed Lottie once. Reduced motion skips playback, and a
three-second fallback prevents a failed player from trapping startup.

The icon artwork and splash artwork serve different purposes: the splash keeps
the original ring and orange dot so it matches the animation. The interface
palette still comes from `@orbii/tokens`.

## Repeat in another project

Copy `generate-assets.ts`, its package script, and `brand.config.json` into that
project's `packages/brand`. Set the project name, light/dark SVG paths, icon
background, and Apple design generation. Use the same `icon/<project>.icon`,
`png/`, `svg/`, and `apps/mobile/assets/<project>.icon` paths. The animation folder
is optional for projects without motion assets. Wire Expo's `ios.icon` to the
Composer directory, the generic `icon` to `assets/icon.png`, and the Android
foreground to `assets/adaptive-icon.png`. This extends Mira's manual copy process
with a repeatable command; Mira's repository itself is unchanged.

The new native dependency and icon require rebuilding the iOS/Android app;
an OTA update alone cannot add them to an already installed binary.
