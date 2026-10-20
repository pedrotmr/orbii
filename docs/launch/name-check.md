# Product name check: Orbii

**Checked:** 19 October 2026

**Decision:** Rename before a public App Store or Google Play listing.

## Recommendation

Do not ship a public store listing under the bare title **Orbii**. An exact App Store title is already live ([Orbii](https://apps.apple.com/us/app/orbii/id6803647562), Orbii LLC, Social Networking, released 10 September 2026). Google Play also surfaces multiple **Orbii** / **ORBII** apps, including the same social product and a women’s-safety app. A subtitle or long store name such as “Travel Phrases: Orbii” does not free the primary name field: Apple and Google search still collide on **Orbii**.

Trademark screens add risk for software classes. USPTO shows a live pending **ORBII** filing in Nice class 42 (AI chatbot software). TMview shows a UK **Orbii** word mark in classes 9 and 42 (mobile application software / SaaS) with status “Application opposed.” EUIPO eSearch returned no **Orbii** trade mark. Brazil’s pePI / BuscaWeb were under maintenance during this check; TMview’s Brazil feed shows a prior **ORBII** class 9 filing that was refused.

This matters for future public distribution, not for the current V2 audience. Spec [#50](https://github.com/pedrotmr/orbii/issues/50) keeps a public App Store launch out of scope; distribution remains TestFlight / trusted users. The production Expo variant in [`apps/mobile/app.config.js`](../../apps/mobile/app.config.js) is still named `Orbii`, and [#107](https://github.com/pedrotmr/orbii/pull/107) prepared store screenshots under that product name. Settle a distinct public name before any store metadata or App Store Connect record is created.

**App Store usability of the name Orbii:** not cleanly usable for a public listing. Exact-title conflict with Orbii LLC is enough on its own. A distinguishing subtitle helps category clarity but does not remove the exact-name collision.

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

**Rechecked:** 20 October 2026. **Current shortlist: zero candidates.** The creator rejected **Orbitoday**, **OrbitRitual**, and **ReturnLoop**; all three are withdrawn from the shortlist.

The new naming direction follows [Spec V2 #50](https://github.com/pedrotmr/orbii/issues/50): return to what matters, choose a small daily focus, and complete that commitment. Short names were explored through metaphors of renewal, rhythm, direction, path, and small steps. None survived the exact/close-name screen. These are rejected research leads, not recommendations or legally cleared names.

### Short concepts screened out

These five short, concept-led directions connect to renewal, gentle momentum, a chosen course, marking a path, and a sustainable rhythm. Apple Search API screens covered the U.S. and Brazil catalogs; Google Play searches covered the U.S. on 20 October 2026. Each idea surfaced an existing adjacent app, so none is a shortlist recommendation.

- **Koru** — a growing spiral suggests renewal and gradual unfolding. Google Play already has [Koru](https://play.google.com/store/apps/details?id=com.koru.mobile), a habit tracker; Apple Brazil also returned [Koru Fit](https://apps.apple.com/br/app/koru-fit/id6755788413).
- **Rill** — a small stream evokes steady movement built from small steps. Apple lists [Rill - Habit Tracker in the U.S.](https://apps.apple.com/us/app/rill-habit-tracker/id6803219708) and [Brazil](https://apps.apple.com/br/app/rill-habit-tracker/id6803219708).
- **Vela** — a small light can symbolize the one thing in focus; the name also suggests keeping a course. Apple lists [Vela: Planner, Habits & Ideas](https://apps.apple.com/us/app/vela-planner-habits-ideas/id6783922107), which combines daily planning and habit tracking under that name.
- **Cairn** — small markers gathered along a path suggest a chosen daily focus set. The name is already used by [Cairn - Hiking Safety Tracker](https://apps.apple.com/us/app/cairn-hiking-safety-tracker/id964300002); Google Play also lists [Cairn](https://play.google.com/store/apps/details?id=com.getcairn.app), an app built around habits and daily commitments.
- **Pace** — a sustainable rhythm fits a small daily commitment. Apple already lists [Pace - Habit Tracker & Goals](https://apps.apple.com/us/app/pace-habit-tracker-goals/id6811940679), whose habit tracker also uses a small solar-system metaphor.

Because these leads failed the store screen, USPTO, EUIPO, TMview, and INPI checks were not completed for them. They are research exclusions, not validated names. This pass supplies **no legally cleared name**; its empty shortlist reflects observed store conflicts and incomplete register coverage. Earlier Orbii findings and the original scope below retain their 19 October 2026 dates.

## Scope

This is a public-store and public-register screen, not a legal clearance opinion. Statuses are as displayed on 19 October 2026. I did not search domain availability, company names, social handles, unregistered use, or every national register. No application, filing, registration, App Store Connect record, or public message was submitted or sent.
