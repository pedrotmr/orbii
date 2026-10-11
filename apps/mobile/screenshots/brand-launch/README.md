# Native launch and Composer icon verification

Captured from an iPhone 17 Pro simulator running iOS 26.2 with an Orbii Dev
**Release** build. The GIFs record the actual app launch: static OS screen,
the ring drawing and orange dot orbiting in Lottie, then the welcome screen.

| Light                                       | Dark                                       |
| ------------------------------------------- | ------------------------------------------ |
| [Cold launch](launch-light.gif)             | [Cold launch](launch-dark.gif)             |
| [Welcome after playback](welcome-light.png) | [Welcome after playback](welcome-dark.png) |
| [Native launcher icon](launcher-light.png)  | [Native launcher icon](launcher-dark.png)  |

[Composer light/dark exports](composer-icons.png) preserve the creator’s TEST
ribbon and material effects. Canonical artwork and regeneration instructions
live in [packages/brand](../../../../packages/brand/README.md).

The startup regression suite covers the root-layout integration, reduced motion,
player failure, lost callbacks, cancelled playback, both themes, and starting
from native-view layout when the loaded callback is absent. The latter issue
was found in native recordings: waiting only for the loaded callback left the
static OS screen covering the animation until startup timed out.
