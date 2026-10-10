# Return Loop splash motion

The circle draws itself clockwise while the orange dot makes one orbit, then
settles into the original logo position with a small pulse. Duration: 1.8 seconds,
60 fps, 512 × 512, transparent background. The final pose matches the SVG master.

| Theme                       | Editable Lottie JSON                  | Packaged dotLottie                           |
| --------------------------- | ------------------------------------- | -------------------------------------------- |
| Light: Pine ring, Coral dot | [JSON](return-loop-splash-light.json) | [dotLottie](return-loop-splash-light.lottie) |
| Dark: Fog ring, Coral dot   | [JSON](return-loop-splash-dark.json)  | [dotLottie](return-loop-splash-dark.lottie)  |

Colors come from `packages/tokens/src/return-loop.json`. The animation contains
only two vector layers, trim-path keyframes, and dot position/scale keyframes:
no fonts, raster images, expressions, external URLs, or playback dependencies.

Import the JSON or dotLottie file into LottieFiles Creator to edit the timing and
motion. JSON also opens in standard Lottie players. Playback is intended to run
once and hold the final frame; looping is for review previews only.

These are animation assets, not an installed launch-flow change. The existing
OS launch screen remains static. App integration would play this after the native
launch screen, honor reduced motion by showing the final logo, and release the
loading screen as soon as the app is ready.

[Light/dark motion preview](../../../screenshots/return-loop/splash-animation.gif)
is rendered from the actual Lottie files.
