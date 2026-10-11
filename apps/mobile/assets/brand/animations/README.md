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
motion. JSON also opens in standard Lottie players. In the app, playback runs
once and then reveals the app beneath the launch overlay. Standalone players
can hold the final frame; looping is for review previews only.

The root layout mounts `LaunchScreen`, which plays the themed JSON once after
the static native launch screen. The app initializes underneath it. Reduced
motion shows the final logo without playback; player failures and a three-second
fallback release startup. Adding the Lottie native player requires a new binary.

[Light/dark motion preview](https://github.com/pedrotmr/orbii/blob/main/apps/mobile/screenshots/return-loop/splash-animation.gif)
is rendered from the actual Lottie files.
