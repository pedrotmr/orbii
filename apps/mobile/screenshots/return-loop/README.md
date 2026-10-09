# Return Loop review gallery

Captured on iPhone 17 Pro, iOS 26.2, from the PR's production components in an
Orbii Dev native build. The interface uses the original light/dark semantic
palette; the logo, wordmark, icon, and splash use the Return Loop brand colors.

Screen captures use deterministic sample habits and inert mutation handlers.
They demonstrate presentation, not an authenticated end-to-end ritual. The main
screens use the production native tab component. Temporary fixture routes and
the splash capture delay were removed before committing.

## Screens

| Gallery                                                                | Light                                | Dark                               |
| ---------------------------------------------------------------------- | ------------------------------------ | ---------------------------------- |
| Sign-in, all three setup steps, create/edit habit, suggested/all icons | [Light](onboarding-light.png)        | [Dark](onboarding-dark.png)        |
| Today's five states, Orbit populated/empty, Settings                   | [Light](app-light.png)               | [Dark](app-dark.png)               |
| Capacity menu and expanded timezone editor                             | [Light](settings-controls-light.png) | [Dark](settings-controls-dark.png) |

Individual screenshots are alongside these boards, named by screen and theme.

## Native assets

[Native iOS captures](native.png) show the installed launcher icon, real light
and dark splash screens, and active/completed Lock Screen Live Activities.
Live Activities were started with sample content and ended after capture.
Status bars and the Lock Screen clock are normalized for reproducible evidence.

[Asset board](assets.png) shows both SVG masters, the app icon, favicon, Android
foreground/background/monochrome layers, both splash exports, and brand swatches.
The actual wordmark appears in the sign-in, setup, and Today captures.

Android runtime capture remains pending: Android SDK tools and an emulator are
unavailable in this environment. Android assets and resolved Expo configuration
were checked statically. A new native build is required for icon/splash changes.
