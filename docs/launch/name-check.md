# Product name check: Orbii

**Checked:** 19–21 October 2026

**Decision:** Keep Orbii for V2/TestFlight; do not rename without a replacement that clears the screen.

## Recommendation

Keep **Orbii** for the current V2/TestFlight audience. No replacement passed the short-name follow-up screen, and public store launch is outside the current V2 scope. For a future public listing, do not use the bare title **Orbii**: an exact App Store title is already live ([Orbii](https://apps.apple.com/us/app/orbii/id6803647562), Orbii LLC, Social Networking, released 10 September 2026), and Google Play surfaces multiple **Orbii** / **ORBII** apps, including the same social product and a women’s-safety app. A descriptive compound title could distinguish the listing text, but it would still use **Orbii** and would need availability and trademark review before release.

Trademark screens add risk for software classes. USPTO shows a live pending **ORBII** filing in Nice class 42 (AI chatbot software). TMview shows a UK **Orbii** word mark in classes 9 and 42 (mobile application software / SaaS) with status “Application opposed.” EUIPO eSearch returned no **Orbii** trade mark. Brazil’s pePI / BuscaWeb were under maintenance during this check; TMview’s Brazil feed shows a prior **ORBII** class 9 filing that was refused.

This matters for future public distribution, not V2. Spec [#50](https://github.com/pedrotmr/orbii/issues/50) keeps a public App Store launch out of scope; distribution remains TestFlight / trusted users. The production Expo variant in [`apps/mobile/app.config.js`](../../apps/mobile/app.config.js) is still named `Orbii`, and [#107](https://github.com/pedrotmr/orbii/pull/107) prepared store screenshots under that product name. Reopen the public naming decision before creating store metadata or an App Store Connect record.

**App Store usability of the name Orbii:** the bare title is not clean for a public listing; it remains usable for the current V2/TestFlight scope. A compound title might distinguish the store listing, but no title was reserved or checked in App Store Connect, and a subtitle does not resolve the trademark questions.

## App-store matches

| Listing                                     | Store records                                                                                                                                   | Why it matters                                                                                              |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Orbii**, Orbii LLC                        | [App Store](https://apps.apple.com/us/app/orbii/id6803647562) · [Google Play](https://play.google.com/store/apps/details?id=com.orbiiapp.orbii) | Exact title. Social Networking; US App Store release 10 September 2026. Closest and highest-risk collision. |
| **Travel Phrases: Orbii**, Himshikhar Gayan | [App Store](https://apps.apple.com/us/app/travel-phrases-orbii/id6759188290)                                                                    | Uses **Orbii** as the distinctive store-name token in Education.                                            |
| **Orbii**, Felipe Marquez                   | [Google Play](https://play.google.com/store/apps/details?id=com.orbii.app)                                                                      | Exact title on Play; restaurant / shift-worker productivity positioning.                                    |
| **ORBII Safety**, ORBII SAFETY              | [Google Play](https://play.google.com/store/apps/details?id=in.orbii.app) · [orbii.in](https://www.orbii.in/)                                   | Exact / near-exact **ORBII** on Play for a voice-SOS safety app (India).                                    |

Near matches such as NETGEAR **Orbi** and many **Orbis** / **Orbi** titles add search noise but are secondary to the exact **Orbii** listings above.

## Trademark matches

### Brazil — INPI

On 19 October 2026 the official [INPI pePI](https://busca.inpi.gov.br/pePI/) and [BuscaWeb](https://buscaweb.inpi.gov.br/) brand search surfaces returned a maintenance page, so a direct pePI exact/radical search could not be completed. Brazil coverage below is from [TMview](https://www.tmdn.org/tmview/#/tmview/results?page=1&pageSize=30&criteria=C&basicSearch=Orbii) (participating office Brazil — INPI). Re-run pePI when it is back before any filing decision.

| Mark       | Record                                                                                                                              | Status and class shown                                                                                                                                                               |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ORBII**  | [TMview BR 928364500](https://www.tmdn.org/tmview/#/tmview/detail/BR500000928364500) (INPI application 928364500)                   | Application refused / ended; Nice class 9; applicant ORBII TECNOLOGIA LTDA; filed 18 October 2022. Goods include data-processing devices and machine-productivity measuring devices. |
| **orbiit** | [TMview](https://www.tmdn.org/tmview/#/tmview/results?page=1&pageSize=30&criteria=C&basicSearch=Orbii) (INPI application 906592577) | Ended; Nice class 42; Orbiit Business Intelligence Ltda. Near spelling, historical only.                                                                                             |

The refused Brazil **ORBII** class 9 record is not an active registration, but it shows prior local use of the exact word in a technology class.

### United States — USPTO

Wordmark search for **Orbii** on the [USPTO Trademark Search](https://tmsearch.uspto.gov/search/) on 19 October 2026 returned two live pending results:

| Mark                        | Official record                                                                                                                                                                                                    | Status and goods/services shown by USPTO                                                                                                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ORBII**                   | [Serial 50032455](https://tsdr.uspto.gov/#caseNumber=50032455&caseSearchType=US_APPLICATION&caseType=DEFAULT&searchType=statusSearch) · [search detail](https://tmsearch.uspto.gov/search/search-results/50032455) | Live / pending (awaiting examination); filed 5 August 2026; owner ORBARCANA LLC. IC 014 bracelets; IC 042 temporary use of online non-downloadable chatbot software using AI for personalized astrology. |
| **ORBII THE CRYSTAL BUDDY** | [Serial 99733091](https://tsdr.uspto.gov/#caseNumber=99733091&caseSearchType=US_APPLICATION&caseType=DEFAULT&searchType=statusSearch) · [search detail](https://tmsearch.uspto.gov/search/search-results/99733091) | Live / pending (published for opposition 22 September 2026); owner Kimberly A Hera. IC 016 children’s books / stickers; IC 028 toys. Less relevant category overlap than the class 42 filing.            |

The pending class 42 **ORBII** filing is the USPTO result closest to a mobile software product.

### European Union — EUIPO

[EUIPO eSearch Plus](https://euipo.europa.eu/eSearch/#basic/1+1+1+1/100+100+100+100/Orbii) for **Orbii** on 19 October 2026 returned **Trade marks (0)**. No EU trade mark hit was shown for the exact string.

### Related foreign hit (TMview)

| Mark      | Record                                                                                 | Status and classes                                                                                                                                                                            |
| --------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Orbii** | [UK00004370525](https://www.tmdn.org/tmview/#/tmview/detail/GB500000004370525) (UKIPO) | Application opposed (status date 6 October 2026); Nice classes 9 and 42; applicant HSTE Limited; filed 9 April 2026. Goods include mobile application software; services include SaaS / PaaS. |

This UK filing is outside the requested EUIPO/INPI/USPTO trio but is included because it is an exact word mark in software classes.

## Short-name exploration

**Rechecked:** 20–21 October 2026. **Current shortlist: zero candidates.** The creator rejected **Orbitoday**, **OrbitRitual**, and **ReturnLoop**; all three are withdrawn from the shortlist.

The new naming direction follows [Spec V2 #50](https://github.com/pedrotmr/orbii/issues/50): return to what matters, choose a small daily focus, and complete that commitment. Short names were explored through metaphors of renewal, rhythm, direction, path, and small steps. None survived the exact/close-name screen. These are rejected research leads, not recommendations or legally cleared names.

### Short concepts screened out

These five short, concept-led directions connect to renewal, gentle momentum, a chosen course, marking a path, and a sustainable rhythm. Apple Search API screens covered the U.S. and Brazil catalogs; Google Play searches covered the U.S. on 20 October 2026. Each idea surfaced an existing adjacent app, so none is a shortlist recommendation.

- **Koru** — a growing spiral suggests renewal and gradual unfolding. Google Play already has [Koru](https://play.google.com/store/apps/details?id=com.koru.mobile), a habit tracker; Apple Brazil also returned [Koru Fit](https://apps.apple.com/br/app/koru-fit/id6755788413).
- **Rill** — a small stream evokes steady movement built from small steps. Apple lists [Rill - Habit Tracker in the U.S.](https://apps.apple.com/us/app/rill-habit-tracker/id6803219708) and [Brazil](https://apps.apple.com/br/app/rill-habit-tracker/id6803219708).
- **Vela** — a small light can symbolize the one thing in focus; the name also suggests keeping a course. Apple lists [Vela: Planner, Habits & Ideas](https://apps.apple.com/us/app/vela-planner-habits-ideas/id6783922107), which combines daily planning and habit tracking under that name.
- **Cairn** — small markers gathered along a path suggest a chosen daily focus set. The name is already used by [Cairn - Hiking Safety Tracker](https://apps.apple.com/us/app/cairn-hiking-safety-tracker/id964300002); Google Play also lists [Cairn](https://play.google.com/store/apps/details?id=com.getcairn.app), an app built around habits and daily commitments.
- **Pace** — a sustainable rhythm fits a small daily commitment. Apple already lists [Pace - Habit Tracker & Goals](https://apps.apple.com/us/app/pace-habit-tracker-goals/id6811940679), whose habit tracker also uses a small solar-system metaphor.

### Follow-up concepts screened out

The second pass on 21 October explored “today is enough,” returning after a miss, gentle rhythm, and daily practice. These are research exclusions, not new shortlist entries:

- **Feito** — small wins and a completed daily action. [Feito! - Pequenas Vitórias](https://apps.apple.com/br/app/feito-pequenas-vit%C3%B3rias/id6792930401) is a Brazilian micro-habit app built around small victories.
- **Retoma** — returning without guilt. [Retoma](https://play.google.com/store/apps/details?id=com.afonsohlc.retoma) is already a Brazilian routine app whose core message is how quickly someone returns to what matters.
- **Pacto** — a chosen commitment. [Pacto](https://apps.apple.com/br/app/pacto/id6755618334) is a promise-keeping app for daily and weekly habits; [Pactly](https://apps.apple.com/br/app/pactly-rastreador-de-h%C3%A1bitos/id6756091774) also uses pacts for habit commitments.
- **Rumo** — a direction to return to. [Rumo](https://play.google.com/store/apps/details?id=com.rumobysf.app) directly positions itself around resuming healthy habits.
- **Ritmo** — a sustainable daily cadence. [Ritmo](https://play.google.com/store/apps/details?id=com.diarioabitudini.app) is already a habit tracker.
- **Pausa** — a moment to choose deliberately. [Pausa](https://play.google.com/store/apps/details?id=com.pausa10.app) uses the same “no guilt” and intentional-choice territory for app use; Apple also lists [Pausa: Screen Time & Focus](https://apps.apple.com/br/app/pausa-screen-time-focus/id6782609827).
- **Lume** — a small light for what matters. [Lume](https://play.google.com/store/apps/details?id=com.novafutura.focuslume) is a focus and screen-time app that also calls itself a habit-control companion.
- **Cerne** — returning to what is central. [Cerne: Know Yourself](https://play.google.com/store/apps/details?id=app.cerne.native) is a self-knowledge app that turns repeated themes into daily practice.
- **Arete** — character built through practice. [Arete: Daily Practice](https://play.google.com/store/apps/details?id=com.bebetterhuman.arete) and [Arete - Journal & Habits](https://play.google.com/store/apps/details?id=com.theareteapp.app) already use the name for daily practice and habit tracking.
- **Tino** — judgment about where to place attention. Apple lists [Tino: Stop Brainrot Be Present](https://apps.apple.com/us/app/tino-stop-brainrot-be-present/id6791889122) in Productivity.

**Suffice** (seven letters; “what we choose today is enough”) did not surface as a matching app title in the Apple Search API or Google Play searches. It was not added: the [USPTO search](https://tmsearch.uspto.gov/search/) returned a cancelled exact mark for hair products and a registered **A SPICE TO SUFFICE** mark in class 30; [EUIPO eSearch](https://euipo.europa.eu/eSearch/#basic/1+1+1+1/100+100+100+100/Suffice) showed **Trade marks (0)**; [TMview](https://www.tmdn.org/tmview/#/tmview/results?page=1&pageSize=30&criteria=C&basicSearch=Suffice) showed a registered French **World Sufficency Lab** mark in classes 9 and 42 and a Brazil **Suffice** record in class 25 with status ended. The anonymous [INPI pePI](https://busca.inpi.gov.br/pePI/) flow reached a page with no searchable form during this pass, so Brazil’s current records were not independently verified there. That software-class similarity plus incomplete direct INPI coverage keeps **Suffice** out of the shortlist.

The expanded store screen still produced no replacement recommendation. Keep **Orbii** for V2/TestFlight; before public distribution, revisit either a distinct name or a legally reviewed compound store title. No App Store Connect reservation or trademark filing was attempted.

Because these leads failed the store screen, USPTO, EUIPO, TMview, and INPI checks were not completed for them. They are research exclusions, not validated names. This pass supplies **no legally cleared name**; its empty shortlist reflects observed store conflicts and incomplete register coverage. Earlier Orbii findings and the original scope below retain their 19 October 2026 dates.

## Scope

This is a public-store and public-register screen, not a legal clearance opinion. The original Orbii findings retain their 19 October 2026 check date; follow-up name screens were checked on 20–21 October 2026. I did not search domain availability, company names, social handles, unregistered use, or every national register. No application, filing, registration, App Store Connect record, or public message was submitted or sent.
