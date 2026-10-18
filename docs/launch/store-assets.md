# Orbii store assets

Prepared 2026-10-18 against [Spec V2, issue #50](https://github.com/pedrotmr/orbii/issues/50), source commit `6346b0d`.

This is an asset preparation package. V2 remains for the creator and trusted users through TestFlight; preparing these assets does not change the approved distribution scope. No App Store Connect upload or public release is part of this work.

## Six screenshots

Use this order. Each linked PNG is a native **1206 × 2622** portrait capture, in light mode, with an opaque RGB image. Captions below are editorial copy for PT-BR and EN; they are not baked into the PNGs. The captured app interface is English in both locales. A Portuguese caption does not imply a Portuguese app localization.

| #   | Screen / file                                                                 | Português (Brasil)                                                                          | English                                                                                 |
| --- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | [Welcome](../../apps/mobile/screenshots/store/01-welcome.png)                 | **Volte ao que importa.** Bons hábitos, um pouco de cada vez.                               | **Come back to what matters.** Good habits, a little at a time.                         |
| 2   | [Today's offer](../../apps/mobile/screenshots/store/02-offer.png)             | **Escolha o que cabe hoje.** Um hábito já basta. Você pode escolher até os cinco da oferta. | **Choose what fits today.** One habit is enough. Pick up to all five in this offer.     |
| 3   | [Committed focus](../../apps/mobile/screenshots/store/03-focus.png)           | **Só estes. Só por hoje.** Dê atenção aos hábitos que você escolheu.                        | **Just these. Just today.** Give your chosen habits a little attention.                 |
| 4   | [Today's Orbit complete](../../apps/mobile/screenshots/store/04-complete.png) | **Orbit de hoje concluído.** Celebre o que você fez, com pontos e um bônus de conclusão.    | **Today's Orbit complete.** Celebrate what you did, with points and a completion bonus. |
| 5   | [Rewards](../../apps/mobile/screenshots/store/05-rewards.png)                 | **Recompensas do seu jeito.** Um saldo de pontos para todas as suas metas.                  | **Rewards, your way.** One point balance for all your goals.                            |
| 6   | [Redemption confirmation](../../apps/mobile/screenshots/store/06-confirm.png) | **Uma pausa bem merecida.** Confira o custo e confirme seu resgate.                         | **A little something to enjoy.** Review the cost and confirm your reward.               |

The offer caption describes the five-habit offer pictured here. In general the offer is `min(5, Orbit size)`; the saved usual count of 2 is guidance, not a daily limit. The two selected habits define today's capacity. Completing them completes today's Orbit even though three offered habits were left unselected.

### Capture provenance

- Device: iPhone 17 Pro simulator, iOS 26.2; 402 × 874 points at 3× scale. Native simulator PNGs preserve 1206 × 2622 pixels; no image was enlarged from the existing 402 × 874 review captures.
- Runtime: existing Orbii Dev Release native binary, with an embedded minified Hermes capture bundle exported from the source commit above. A temporary fixture route harness bypassed authentication and supplied sample state to production UI. It was removed after capture. These are native production-component demonstrations, not an authenticated end-to-end session or proof of a production signing build.
- Production presentation: `WelcomeContent`, `TodayHeader`, `TodayRevealPhase`, `TodayActivePhase`, `TodayCompletePhase`, `RewardsScreen`, `RewardCard`, `ScreenScaffold`, and `AppTabs`. The native reward confirmation alert uses the production title, message, and buttons. No UI styling or product copy was changed for capture.
- Fixture transitions: the capture harness locally selects, commits, and checks off habits. Rewards queries return fixed sample data; mutation callbacks are inert. No account, backend writes, real redemptions, or OAuth interactions are used.
- Samples: A short walk (10), Read a few pages (20), Drink water (10), Stretch (10), Write a little (20). Commit the first two. Capture focus with the walk checked. The offer is scrolled slightly to keep its commit button visible; completion is scrolled to the summary, with the full completion ring, both checked habits, points, and streak visible (the headline is above the viewport). Completion shows **50 points = 10 + 20 + 20 completion bonus**, a 3-day streak, and 12 completed Orbits.
- Rewards sample: **150 spendable points**, representing 100 prior points plus today's 50. Coffee and a quiet hour costs 100; A new book costs 300. Confirming the first would leave 50. The screenshot stops at confirmation, before any deduction. Reward progress is capped at its cost; points are not reserved per goal.
- Appearance: system light mode, default text size, 9:41 status bar, full battery, no personal data. Capture after transitions settle. Export removes the alpha channel without changing dimensions or visible content.
- Reference inputs: [Release launch captures](../../apps/mobile/screenshots/brand-launch/README.md), [V2 component captures](../../apps/mobile/screenshots/v2/README.md), [brand artwork](../../packages/brand/README.md), [semantic UI tokens](../../packages/tokens/src/native.ts), and [Return Loop brand palette](../../packages/tokens/src/return-loop.json). Use the canonical mark and current semantic interface colors; the brand palette does not replace the interface palette. Launcher/Composer images containing the TEST ribbon are excluded.

### Repeat the captures

1. Start from the source commit above and install dependencies. Use a disposable local copy of the Release simulator app, not a distributed binary.
2. In a temporary route harness, render the production components listed above with the sample data. Keep the normal native tabs. Supply rewards query results locally and replace mutations with inert callbacks. Do not add a bypass to a shipping build.
3. Export the capture bundle with `expo export:embed --platform ios --dev false --bytecode`, embedding it and its assets into that disposable Release simulator app. Install on the iPhone 17 Pro simulator. This bundle must exclude unrelated notification routes if the existing native binary predates that module.
4. Set light mode and normalize the status bar to 9:41 / full battery. Capture Welcome. Open Today with the five-habit offer and the first two selected; scroll down slightly to reveal the full commit button and capture Offer. Commit, check the walk, and capture Focus. Check Read, scroll to the completion summary, and capture Complete. Open Rewards, capture the two goals, tap the eligible reward's Redeem button, and capture the confirmation alert without confirming.
5. Save full-resolution images with `xcrun simctl io <udid> screenshot <file.png>`. Remove alpha losslessly with `magick <file.png> -alpha off PNG24:<file.png>`. Check each image's dimensions, channel count, content, and order. Restore all temporary source edits and the original simulator app.

## 30-second app preview script

Make separate PT-BR and EN edits using the same timing. Each row's localized line is both the optional voiceover and the on-screen caption; use only one language per edit. Keep captions in a clear overlay area and do not obscure habit names, point values, checkboxes, or confirmation buttons. The story must remain understandable muted. Use actual in-app recordings, clean cuts, and no device frame, simulated UI, external footage, or launcher TEST icon.

Start recording after signing into a dedicated demo account and completing setup. Record the real flow; the screenshot fixture bundle is for stills only. Prepare at least five Orbit habits and a 100-point starting balance, with the reward costs above. Capture habit actions as separate clips and edit out elapsed real-world activity; checking a habit represents work already completed, not completing a walk or reading in seconds.

| Time        | Duration | Shot and action                                                                                                                        | PT-BR voice / caption                               | EN voice / caption                             |
| ----------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------- |
| 00:00–00:04 | 4 s      | Today idle, brand visible. Hold for 1 s; tap the reveal button. Cut to the settled offer.                                              | Volte ao que importa, um pouco a cada dia.          | Come back to what matters, a little each day.  |
| 00:04–00:09 | 5 s      | Five-habit offer; select the walk and reading. Hold on the two selected cards. Use this settled view at **00:05** as the poster frame. | Escolha o que cabe hoje. Um hábito já basta.        | Choose what fits today. One habit is enough.   |
| 00:09–00:13 | 4 s      | Tap “Commit today's Orbit.” Hold on the two committed habits in the active view.                                                       | Só estes. Só por hoje.                              | Just these. Just today.                        |
| 00:13–00:18 | 5 s      | Cut to a later check-off of the walk. Show one completed habit and one remaining; then check reading.                                  | Fez? Marque e veja seu progresso de hoje.           | Done? Check it off and see today's progress.   |
| 00:18–00:23 | 5 s      | Hold on “Today's Orbit complete,” then scroll to 50 points and streak. No all-Orbit completion percentage or extra habit selection.    | Orbit de hoje concluído. E mais 20 pontos de bônus. | Today's Orbit complete. Plus a 20-point bonus. |
| 00:23–00:27 | 4 s      | Tap Rewards. Show the 150-point shared balance and the eligible 100-point reward.                                                      | Seus pontos, suas recompensas.                      | Your points, your rewards.                     |
| 00:27–00:30 | 3 s      | Tap Redeem. Hold the native confirmation showing cost and 50 points remaining. End before confirming, on the actual app UI.            | Confira e confirme quando quiser.                   | Review it. Confirm when you're ready.          |

**Total: 4 + 5 + 4 + 5 + 5 + 4 + 3 = 30 seconds.** No claim of guaranteed streaks, automatic habit completion, cash rewards, AI scheduling, or a public launch. Use gentle delivery without urgency. Optional music must be licensed; voice and music should not compete. No video file is included in this deliverable; this is the recording and editing script.

## Apple export requirements

Checked 2026-10-18 against Apple's [screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications) and [app preview specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/app-preview-specifications). Recheck these pages before a future submission.

- **Screenshots:** Apple permits 1–10 images per device size in PNG/JPEG, without alpha or transparency. This six-image set uses the accepted **1206 × 2622 portrait** size for iPhone with Dynamic Island, medium display. It is an iPhone set only; if the submitted app supports iPadOS, prepare the required iPad 13-inch set separately.
- **Preview:** export **886 × 1920 portrait**, not the screenshot's 1206 × 2622 dimensions. Apple's accepted video resolution differs from native device resolution. Set **30 fps**, progressive H.264, target **10–12 Mbps**, `.mp4`, at most **500 MB**. Use stereo AAC **256 kbps**, 48 kHz, with all audio tracks enabled if including audio. Apple allows 15–30 seconds; this script is exactly 30 seconds (900 frames at 30 fps). Avoid an encoder-added tail that exceeds 30 seconds.
- Select the **5-second poster frame** described above. Apple allows up to three previews per supported device size and language; this plan calls for one per language. Previews appear before screenshots. These are export instructions only, not upload authorization.

## Review evidence

The six PNGs are the review artifacts. Check the screenshot table in order, then compare the preview's offer → commit → check-off → completion → rewards → confirmation sequence against Spec V2. The PR records repository gate results. This change adds documentation and image assets only; it adds no environment variables and requires no Convex deployment or data migration.
