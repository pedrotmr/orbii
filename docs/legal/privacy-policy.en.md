# Privacy Policy — Orbii

**Status:** Draft for product review. **Not legal advice.** Sections marked **[LAWYER]** need counsel before you treat this as an official policy or publish it to App Store Connect.

**Effective date (draft):** 19 October 2026  
**Last updated (draft):** 19 October 2026  
**App:** Orbii (`app.orbii.mobile`)  
**Operator (draft):** Pedro Ramos / Orbii — **[LAWYER: confirm legal name, entity type, and jurisdiction]**  
**Contact (draft):** **[LAWYER: confirm a monitored privacy contact address]** — until confirmed, use the email listed on the Orbii GitHub profile for `pedrotmr`.

This draft describes how Orbii handles information based on the current V2 product ([Spec V2](https://github.com/pedrotmr/orbii/issues/50)), the Convex schema, and remote MCP access (PR #108). It is written to support Apple App Store Review Guideline **5.1.1(i)** (privacy policy link in App Store Connect metadata **and** easily accessible inside the app) and related expectations in **5.1.1** / **5.1.2**. Hosting the URL and wiring the in-app link are separate steps; see [hosting.md](./hosting.md).

---

## 1. Who we are

Orbii is a personal habit app. You keep many habits in an **Orbit** and choose a small daily focus set. Success is completing **Today’s Orbit**, not covering every habit in the Orbit.

Orbii is currently intended for the creator and a small set of trusted users (for example via TestFlight or a development build). A public App Store launch remains out of scope for V2 product scope, but App Store privacy requirements still apply whenever you distribute through App Store Connect.

**[LAWYER]** Confirm the data controller / business identity (individual developer vs. company), registered address if required, and which privacy laws you claim to follow (for example LGPD in Brazil, GDPR if you serve EU/EEA users, CCPA if California residents are in scope).

---

## 2. Summary

| Topic | Current practice (as implemented) |
| --- | --- |
| Account | Required. Sign in with **Google** or **Apple** via **Clerk**. |
| App data | Stored in **Convex** (habits, daily sessions, points, rewards, agent connections). |
| Analytics / ads | Orbii does **not** ship a third-party analytics or advertising SDK in the mobile app at the time of this draft. |
| Notifications | Optional **local** reminders only; no remote push for daily reminders. |
| Connected agents | Optional. You authorize third-party MCP clients with `orbii:read` and/or `orbii:write`. |
| Sale of data | We do **not** sell your personal information. **[LAWYER: confirm “sell” / “share” language for target jurisdictions]** |

---

## 3. Information we collect

### 3.1 Account and authentication (Clerk)

When you sign in, **Clerk** processes authentication data on our behalf, including:

- A Clerk user identifier (we store this as `clerkUserId` in Convex)
- Identity-provider information from **Google** or **Apple** (for example email and display name that Clerk receives from the provider, subject to what you share with that provider and Clerk’s configuration)

We do **not** offer email/password sign-in in V2. Sign-in is Google or Apple only.

Clerk’s processing of end-user “Customer Data” is described in [Clerk’s Privacy Policy](https://clerk.com/legal/privacy) (Clerk acts as a processor for that Customer Data; Orbii is the customer). See also [Clerk subprocessors](https://clerk.com/legal/subprocessors).

**[LAWYER]** Confirm which Clerk fields Orbii’s Clerk instance is configured to retain (email, name, avatar, OAuth tokens) and whether any Clerk Dashboard features (for example session recording analytics on Clerk’s own properties) are irrelevant to end users of the app.

### 3.2 App content and settings (Convex)

We store the following in **Convex**, keyed to your Clerk user id:

- **Profile / preferences:** default daily capacity, saved timezone, streak, completed-day count, last completed local date, points balance, rewards visibility
- **Habits (Orbit):** name, glyph, category (`body`, `mind`, `learn`, `life`), order, point value
- **Day sessions:** local calendar date, ritual phase, offered / selected / committed / completed habit ids, earned points, committed point-value and habit name snapshots
- **Point transactions:** amount, source type (habit award, completion bonus, reward redemption), source name snapshot, local date
- **Rewards:** name, cost, active/redeemed status, redemption timestamps when applicable
- **Connected agents:** client id and name, OAuth application id, granted scopes, token fingerprint, encrypted access token, connection / last-seen / revocation metadata
- **MCP idempotency records:** short-lived request fingerprints for certain write tools (for example habit add / re-reveal / commit deduplication)

**Convex** privacy and subprocessors: [Convex Privacy Policy](https://www.convex.dev/legal/privacy), [Subprocessors](https://www.convex.dev/legal/subprocessors), [DPA](https://www.convex.dev/legal/dpa).

**[LAWYER]** Habit names and categories may incidentally describe health, fitness, or other sensitive topics. Confirm whether you need special handling, notices, or App Privacy “Sensitive Info” / health-related disclosures for App Store Connect.

### 3.3 On-device data

Stored only on your device (not synced to Convex as of this draft):

- Theme preference (AsyncStorage)
- Daily reminder on/off preferences (AsyncStorage, scoped per user id)
- Scheduled **local** notification payloads for morning/evening reminders (refreshed when the app opens; about ~30 days of one-off schedules while reminders stay enabled)
- Optional **iOS Live Activity** state for Today’s Orbit (ActivityKit; local updates; no APNs / server push for this feature)
- Auth session material managed by Clerk / Expo Secure Store on device

Daily reminders use `expo-notifications` with **remote notifications disabled** in the app config. Reminder copy does not name open habits.

### 3.4 Connected agents (remote MCP)

If you connect a compatible agent client:

- Authorization uses **Clerk OAuth**. Orbii verifies opaque access tokens with Clerk’s Backend API.
- On first authenticated MCP use, Orbii stores the client name, client id, granted scopes, and an **AES-GCM encrypted** opaque access token in Convex.
- Identity for MCP calls is taken only from the verified token subject. Tool arguments never accept a caller-supplied Orbii user id.
- You can review and revoke connections in **Settings → Connected agents**. Revocation blocks the token in Orbii and asks Clerk to revoke access/refresh tokens; encrypted credentials are erased after Clerk confirms.

**Scopes**

| Scope | What it allows |
| --- | --- |
| `orbii:read` | Read your Orbit habit list and today’s ritual state (offer, selections, commitment, completion). |
| `orbii:write` | Start / re-reveal today; select / deselect offered habits; commit; complete / uncomplete committed habits; add / remove Orbit habits. |

Write grants let the authorized client perform those actions **without** an additional Orbii confirmation per action. Excluded from MCP: habit edit/reorder (beyond add/remove), account settings, and other product actions not listed above.

**Important:** A connected agent is a **third party you choose**. Once authorized, that client (and any systems it uses) may receive or act on Orbit and Today data within the granted scopes. Orbii does not control how that third-party client stores or further processes data after it receives it.

**[LAWYER]** Confirm how to characterize user-authorized MCP clients (independent controllers vs. processors), required consent language under LGPD/GDPR/Apple 5.1.2 (including disclosure before sharing with third-party AI), and whether agent clients must be named individually in the policy or can be described generically.

### 3.5 Technical / service infrastructure

Depending on how you install updates and run the app, **Expo / EAS** (for example OTA updates via `u.expo.dev`) and Apple / Google platform services may process device and delivery telemetry under their own terms. See [Expo Privacy](https://expo.dev/privacy).

We do not intentionally collect precise GPS location. Timezone is a user-saved IANA timezone string used for local calendar-day boundaries.

---

## 4. How we use information

We use the information above to:

- Authenticate you and keep your Orbit and Today’s ritual in sync across sessions
- Compute streaks, points, rewards, and history according to Orbii’s product rules
- Honor your reminder preferences with on-device local notifications
- Show optional Live Activities on iOS
- Operate Connected agents with the scopes you grant, and revoke them when you ask
- Secure the service (for example token verification, encrypted credential storage, abuse prevention)
- Respond to support or privacy requests you send us

We do **not** use your Orbit content for advertising. We do **not** sell personal information. **[LAWYER: confirm]**

---

## 5. How we share information

We share information only as needed to run Orbii:

| Recipient | Role | Examples |
| --- | --- | --- |
| **Clerk** | Authentication / OAuth | Sign-in with Google or Apple; MCP OAuth token issue / verify / revoke |
| **Google / Apple** | Identity providers | Sign-in; governed by their policies and your account settings |
| **Convex** | Application database and HTTP MCP endpoint | Storage of app data and agent connection metadata |
| **Expo / EAS** | App distribution / updates | Build and update delivery when you use those channels |
| **Connected agent clients** | User-authorized third parties | Orbit / Today read or write within `orbii:read` / `orbii:write` |
| **Authorities** | Legal compulsion | If required by law **[LAWYER]** |

We require service providers that process personal data for Orbii to protect it under their contracts and policies. **[LAWYER: align with Apple 5.1.1(i) “same or equal protection” wording and your DPAs]**

---

## 6. Retention

| Data | Retention (current product intent) |
| --- | --- |
| Convex account & Orbit data | Kept while your account exists |
| Point transactions & redeemed rewards | Kept while your account exists (history / redeemed list are product features) |
| Agent connection records | Kept while connected; after successful revocation, encrypted tokens are erased; connection history metadata **[confirm whether rows are deleted or only marked revoked]** |
| MCP idempotency records | Short-lived (for example habit-add deduplication about **24 hours**) |
| On-device reminder schedules | Cleared or stop refreshing if reminders are off or the app is not opened |
| Clerk account data | Per Clerk retention and your deletion request |

**[LAWYER]** Set firm retention schedules and backup deletion timelines.

---

## 7. Your choices and deletion

### 7.1 In-product controls

- Change timezone, capacity, rewards visibility, and reminder toggles in Settings
- Revoke Connected agents independently in Settings → Connected agents
- Disable notification permission in system Settings
- Sign out via the Clerk session controls in the app

### 7.2 Account and data deletion

**[LAWYER] [PRODUCT GAP]** Apple Guideline **5.1.1(v)** requires that if the app supports account creation, it must also offer **account deletion within the app**. Orbii currently has **no** in-app “delete account” flow and **no** Convex mutation that erases a user’s full dataset. Until that ships, deletion is **manual**: contact the privacy address above and request deletion; we will delete Convex records tied to your `clerkUserId` and request deletion of the Clerk user, subject to verification.

Draft commitment once product support exists:

1. In-app **Delete account** control  
2. Deletes Convex user data (users, habits, day sessions, point transactions, rewards, agent connections, MCP request tables)  
3. Revokes connected OAuth tokens via Clerk  
4. Deletes the Clerk user  
5. Confirms completion to the requester  

**[LAWYER]** Define identity verification, SLA (for example 30 days), and exceptions (legal holds).

### 7.3 Access / correction / portability / objection

**[LAWYER]** Add rights language appropriate for LGPD (and GDPR/CCPA if applicable), including how to exercise them.

---

## 8. Children

Orbii is not directed to children. **[LAWYER: set minimum age — e.g. 13 / 16 / 18 — and COPPA/LGPD children’s rules].** We do not knowingly collect personal information from children below that age. If you believe a child has used Orbii, contact us and we will delete the account.

---

## 9. International transfers

Clerk, Convex, Expo, Google, and Apple may process data in the United States and other countries. **[LAWYER]** Document transfer mechanisms (SCCs, LGPD international transfer bases, etc.).

---

## 10. Security

We use industry-standard measures appropriate to a small app, including TLS in transit, Convex access controls keyed to authenticated Clerk subjects, opaque OAuth tokens for MCP, and AES-GCM encryption for stored MCP access tokens. No method of transmission or storage is 100% secure.

---

## 11. Changes

We may update this policy. For material changes we will update the “Last updated” date and, where appropriate, notify you in the app or by other reasonable means. **[LAWYER: consent vs. notice rules]**

---

## 12. Contact

Privacy questions and deletion requests: **[LAWYER: insert address]**  
GitHub project: [https://github.com/pedrotmr/orbii](https://github.com/pedrotmr/orbii)

---

## 13. App Store Privacy labels (engineering checklist)

Not part of the legal policy text; for App Store Connect “App Privacy” nutrition labels. Confirm with counsel before submitting.

Likely **collected** data types (draft):

- **Contact Info** — email (via Clerk / identity provider), possibly name  
- **Identifiers** — user id (Clerk)  
- **User Content** — habit names, reward names, ritual history  
- **Usage Data** — product events stored as day sessions / transactions (not a separate analytics SDK)  
- **Diagnostics** — only if Expo/Apple crash tooling is enabled later  

Likely **not** collected by Orbii today: Precise Location, Tracking (ATT), advertising data, HealthKit.

Linked to user / used for app functionality: yes for account and content. Tracking: no (draft). Third-party advertising: no (draft).

---

*This document is a draft. Do not publish or submit to App Store Connect until counsel review and a public HTTPS URL are ready.*
