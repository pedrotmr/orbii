# Component catalog

## `packages/ui` (import `@mira/ui/native/<name>`)

| Component          | Key props                              | Use instead of                                 |
| ------------------ | -------------------------------------- | ---------------------------------------------- |
| `Text`             | `variant`, `tone`, `align`             | Raw `fontSize` + `color` + `fontWeight` combos |
| `Button`           | `variant`, `size`, `loading`           | Custom `Pressable` + label styles              |
| `Card`             | `variant`: plain \| raised \| outlined | Manual card surface + `softShadow`             |
| `Screen`           | safe area wrapper                      | Repeated screen padding/bg                     |
| `TextField`        | `label`, `multiline`                   | Label + `TextInput` stacks                     |
| `SelectDrawer`     | options picker                         | Custom modal pickers                           |
| `BottomActionBar`  | sticky footer actions                  | Fixed bottom button rows                       |
| `ProgressSegments` | step indicator                         | Custom dot/step bars                           |

## `apps/mobile/src/components/ui` (app-level)

| Component                  | Notes                                    |
| -------------------------- | ---------------------------------------- |
| `SegmentControl`           | Pill segmented control                   |
| `AnimatedSegmentedControl` | Animated variant — consider merging APIs |
| `UnderlineTabs`            | Text + underline tabs                    |
| `AspectFitImageFrame`      | Media aspect wrapper                     |
| `StaggerFadeIn`            | List entrance animation                  |

## `apps/mobile/src/components` (feature — check before duplicating)

Navigation: `AppHeader`, `HeaderToolbar`, `FixedPageHeader`, `SubpageScreen`
Feed: `MuralPostCard`, `CommentDrawer`
Profile: `ProfileHero`, `ProfileStatCard`, `ProfileSegmentedTabs`
Rankings: `RankingsChipGroup`, `RankingsLeaderboardList`, `RankingsOverallCard`
Play: `MatchCard`
