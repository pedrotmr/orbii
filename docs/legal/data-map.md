# Orbii data map (draft)

Internal engineering map for the privacy policy drafts. Sources: Convex `schema.ts`, Spec V2 (#50), remote MCP (PR #108), `apps/mobile/app.config.js` / `app.json`, reminder + Live Activity code. **Not legal advice.** Items marked **[LAWYER]** or **[PRODUCT]** need a decision before shipping a public policy.

## Inventory

| What | Where stored | Processor / system | Retention (intent) | Deletion path | Notes |
| --- | --- | --- | --- | --- | --- |
| Clerk user id (`clerkUserId`) | Convex `users` (+ all user-scoped tables) | Convex; id issued by Clerk | While account exists | **[PRODUCT]** Manual today → future in-app delete must wipe all tables by `clerkUserId` | Auth subject; never accept caller-supplied user id on MCP |
| Email / name / avatar from Google or Apple | Clerk (not duplicated into Convex schema) | Clerk; Google / Apple as IdPs | Per Clerk + IdP | Delete Clerk user; revoke IdP link via Clerk | Confirm exact Clerk fields **[LAWYER]** |
| Default capacity, timezone, streak, daysCompleted, lastCompletedLocalDate, pointsBalance, rewardsVisible | Convex `users` | Convex | While account exists | Delete `users` row | Timezone = IANA string, not GPS |
| Habits (name, glyph, category, order, pointValue) | Convex `habits` | Convex | While account exists / until user removes habit | `habits` delete; MCP `remove_habit` | Categories may imply health **[LAWYER]** |
| Day ritual state + snapshots | Convex `daySessions` | Convex | While account exists | Delete by user | Includes habit name snapshots at commit |
| Point ledger | Convex `pointTransactions` | Convex | While account exists | Delete by user | History is a product feature |
| Rewards | Convex `rewards` | Convex | While account exists; redeemed kept read-only | Delete active via product; redeemed rows need account wipe | No undo after redeem |
| Agent client id/name, OAuth app id, scopes, token fingerprint, encrypted access token, connected/lastSeen/revoked | Convex `agentConnections` | Convex; tokens verified/revoked via Clerk | While connected; encrypted token erased after Clerk confirms revoke | Settings → Connected agents; then account wipe | AES-GCM; opaque tokens required |
| MCP write idempotency (habit add / re-reveal / commit) | Convex `remoteMcpHabitRequests`, `remoteMcpRerevealRequests`, `remoteMcpCommitRequests` | Convex | Short-lived (~24h for habit-add dedupe per README) | TTL / cleanup **[PRODUCT: confirm automated purge]** | Not user-visible |
| Theme preference | Device AsyncStorage `@orbii/theme-preference/v1` | On-device only | Until cleared / uninstall | Uninstall or clear app data | Not in Convex |
| Reminder on/off prefs | Device AsyncStorage `@orbii/daily-reminders/v1/{userId}` | On-device only | Until cleared | Settings toggles / uninstall | |
| Local notification schedule | iOS/Android notification center via expo-notifications | On-device; `enableRemoteNotifications: false` | ~30 days rolling while enabled; stops if app not opened | Disable reminders / deny permission | Copy does not name open habits |
| Live Activity (Today) | ActivityKit on device | On-device; no APNs for this feature | Ends on complete / re-reveal / new local day / dismiss | Dismiss or day end | Optional |
| Clerk session / secure credentials | Device (Secure Store / Clerk SDK) | Clerk SDK on device | Session lifetime | Sign out | |
| OTA / build delivery telemetry | Expo / EAS (`u.expo.dev/{projectId}`) | Expo | Per Expo | N/A (platform) | See Expo Privacy |
| MCP tool payloads in transit | HTTPS to `https://<deployment>.convex.site/mcp` | Convex HTTP actions; authorized agent client | Request lifetime (+ client-side retention outside Orbii) | Revoke agent; client must delete its copies **[LAWYER]** | User-authorized third party |

## MCP scopes

| Scope | Tools / capability | Data exposed or mutable |
| --- | --- | --- |
| `orbii:read` | `get_orbit`, `get_today` | Full Orbit habit list; today’s phase, offer, selections, commitment, completion state |
| `orbii:write` | `start_today`, `rereveal_today`, `select_habit`, `deselect_habit`, `commit_today`, `complete_habit`, `uncomplete_habit`, `add_habit`, `remove_habit` | Mutates ritual and Orbit per Spec V2 / backend rules; write grant = no per-action Orbii confirm |

Out of MCP scope: habit edit/reorder (beyond add/remove), account settings, points/rewards management, other product actions.

Consent UX: Clerk OAuth consent identifies client + requested scopes; Settings lists connections for independent revocation.

## What we do not collect (current build)

- Third-party mobile analytics / ad SDKs (none in `apps/mobile` dependencies for that purpose)
- Remote push tokens for daily reminders
- Precise location
- ATT tracking / advertising ID for ads
- HealthKit / clinical data APIs
- Social graph or contacts

## Apple 5.1.1 / 5.1.2 checklist (draft)

| Requirement | Status |
| --- | --- |
| 5.1.1(i) Privacy policy URL in App Store Connect | **Blocked** until hosted HTTPS URL exists ([hosting.md](./hosting.md)) |
| 5.1.1(i) Easily accessible link **inside the app** | **Not shipped** — needs Settings (or similar) entry pointing at the hosted policy |
| 5.1.1(i) Identify data, collection, uses | Covered in policy drafts |
| 5.1.1(i) Third parties afford equal protection | Stated; **[LAWYER]** |
| 5.1.1(i) Retention / deletion / revoke consent | Drafted; deletion path incomplete until in-app delete |
| 5.1.1(v) Account deletion **in app** | **[PRODUCT]** Missing — manual contact only |
| 5.1.2 Disclose third-party / AI sharing; get permission | MCP agents are the main case — consent via OAuth; **[LAWYER]** tighten copy |
| App Privacy nutrition labels | Checklist in policy §13; confirm before ASC submit |

## Open product / legal decisions

1. **[PRODUCT]** Ship in-app account deletion (required for App Store if accounts exist).  
2. **[LAWYER]** Privacy contact email + controller legal name.  
3. **[LAWYER]** LGPD (and any GDPR/CCPA) rights text, age gate, international transfers.  
4. **[PRODUCT]** Confirm whether revoked `agentConnections` rows are hard-deleted or kept as audit stubs.  
5. **[PRODUCT]** Automate purge of MCP idempotency tables.  
6. **[LAWYER]** Whether habit categories / names need health-sensitive disclosures.
