# Research: local daily reminders in Orbii's Expo build

Ticket: [#56](https://github.com/pedrotmr/orbii/issues/56). Unblocks [#57 Decide daily reminder rules](https://github.com/pedrotmr/orbii/issues/57).
Researched 2026-10-02 against `main` at `d24a757`.

## Answer

Orbii can send both reminders with `expo-notifications` alone. It needs no server, no APNs key, no push token, and no FCM credentials. It does need a new native build (dev client and TestFlight), because `expo-notifications` is not in the app today.

The hard part is the evening skip. A local notification cannot check Convex when it fires. So the app has to cancel or reschedule from JavaScript while it runs. If the user does not open the app, the schedule stays as it was the last time the app ran.

## What the repo has today

- `expo` `58.0.0-preview.4`, React Native `0.88.0-rc.1`, `expo-dev-client`, `expo-widgets` `58.0.7`. SDK 58 bundles `expo-notifications` `~58.0.4` (from `expo@58.0.0-preview.4/bundledNativeModules.json`). Latest on npm is `58.0.11`.
- `expo-notifications` is not installed. No code in `apps/mobile` touches notifications.
- `apps/mobile/ios/` is gitignored (continuous native generation). Config plugins in `app.json` decide the native project.
- Variants in `apps/mobile/app.config.js`: `development` and `preview` share bundle ID `app.orbii.mobile.dev`. `production` is `app.orbii.mobile`. The Android package uses the same IDs.
- The `expo-widgets` plugin runs with no options, so `enablePushNotifications` is `false`. The app has no `aps-environment` entitlement today (`ios/Orbii/Orbii.entitlements` has only Sign in with Apple and the app group).
- The Orbii day comes from `users.timezone` in Convex (`apps/mobile/src/local-date.ts`, `useTodayLocal(user?.timezone)`). This stored setting can differ from the device time zone.

## Scheduling a daily reminder

`scheduleNotificationAsync` takes a trigger. The ones that matter here ([docs, SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/notifications/)):

| Trigger                      | Platforms    | Repeats  | Time zone field    |
| ---------------------------- | ------------ | -------- | ------------------ |
| `DAILY` (`hour`, `minute`)   | iOS, Android | yes      | no                 |
| `CALENDAR` (date components) | iOS only     | optional | yes, `timezone`    |
| `DATE` (one instant)         | iOS, Android | no       | no (absolute time) |
| `WEEKLY`                     | Android      | yes      | no                 |

Helpers: `cancelScheduledNotificationAsync(id)`, `cancelAllScheduledNotificationsAsync()`, `getAllScheduledNotificationsAsync()`, `getNextTriggerDateAsync(trigger)`. You can pass your own `identifier` when scheduling, so the app can address "evening-2026-10-02" directly.

How the native code builds the triggers (read from `expo-notifications@58.0.11`):

- iOS `DAILY` becomes `UNCalendarNotificationTrigger(dateMatching: {hour, minute}, repeats: true)` with no time zone (`ios/.../TriggerRecords.swift`).
- Android `DAILY` computes the next fire time in the device's default time zone, then sets one alarm. After it fires, it computes the next one (`NotificationTriggers.kt`).
- Android re-registers alarms after `BOOT_COMPLETED` and `MY_PACKAGE_REPLACED`. It has no receiver for time zone changes.

## Time zone behavior

- iOS, no time zone on the trigger: an Apple engineer says it "will fire when the specified DateComponents match the actual time", so it follows the device. A developer in the same thread reports the opposite: the trigger stayed locked to the zone it was scheduled in ([Apple forums 811265](https://developer.apple.com/forums/thread/811265), Jan 2026). Treat this as unverified until tested on a device.
- iOS `CALENDAR` with `timezone` set pins the reminder to that zone. This is the only trigger that could use `users.timezone` directly.
- Android: the pending alarm keeps its absolute instant when the zone changes. The new zone applies from the next computation.
- Mismatch risk: `DAILY` fires in device time, but the Orbii day uses `users.timezone`. If a user travels and keeps the stored zone, "8:00" in device time is not 8:00 in their Orbii day.
- Simple mitigation that works everywhere: reschedule on every app start and foreground. Or use `DATE` triggers computed from `users.timezone`.

## Permissions

iOS:

- `requestPermissionsAsync({ ios: { allowAlert, allowSound, allowBadge } })`. Read `ios.status`, not the root `status` ([docs](https://docs.expo.dev/versions/v58.0.0/sdk/notifications/)).
- The system prompts once. Later requests return the stored answer without a prompt. After a denial the only path is the Settings app ([Apple: Asking permission](https://developer.apple.com/documentation/usernotifications/asking-permission-to-use-notifications)).
- Apple suggests asking in context, for example when the user turns reminders on, not on first launch.
- Provisional authorization (`allowProvisional`) delivers quietly to Notification Center with no prompt. No banner, no sound, no lock screen.

Android:

- Android 13+ needs `POST_NOTIFICATIONS` (the library manifest declares it). The system prompt "will not appear until at least one notification channel is created".
- Create a channel with `setNotificationChannelAsync` before asking. After creation, only name and description can change. With no channel, the library creates "Miscellaneous".
- Exact timing: without `SCHEDULE_EXACT_ALARM`, the library falls back to `setAndAllowWhileIdle`. Android 12+ fires those "within one hour of the supplied trigger time" unless Doze or battery saver applies ([Android alarms](https://developer.android.com/develop/background-work/services/alarms)). `SCHEDULE_EXACT_ALARM` is not pre-granted to fresh installs targeting API 33+.
- New in SDK 58: `delivery: 'alarmClock'` on `DATE`/`DAILY`/`WEEKLY` uses `AlarmManager.setAlarmClock()`. It also needs the exact alarm permission ([changelog](https://github.com/expo/expo/blob/main/packages/expo-notifications/CHANGELOG.md)).

## Skipping the evening reminder when the Orbit is complete

Facts that constrain every option:

- A repeating trigger is one request. Cancelling it cancels every future day, not only today.
- iOS runs no app code when a local notification fires. A notification service extension can change content, but only for remote notifications ([Apple: UNNotificationServiceExtension](https://developer.apple.com/documentation/usernotifications/unnotificationserviceextension)).
- iOS keeps only the soonest 64 pending notifications per app. A repeating notification counts as one ([Apple: UILocalNotification](https://developer.apple.com/documentation/uikit/uilocalnotification), [Apple forums 811171](https://developer.apple.com/forums/thread/811171)).
- Background tasks (`expo-background-task`) do not help much. On iOS, `BGTaskScheduler` "decides the best time" and may run later or not at all ([docs](https://docs.expo.dev/versions/v58.0.0/sdk/background-task/)).
- If the app is in the foreground when a reminder fires, `setNotificationHandler` can hide it. SDK 58 breaking change: foreground notifications now show by default unless the handler says otherwise.

Ways to skip, and what happens when the user does not open the app:

1. Repeating `DAILY` evening, no skip. Always fires. Works forever with no app opens. Fires on complete days.
2. One-off `DATE` evenings for the next N days, one ID per day. On completion, the app cancels today's. On each app open, the app tops the queue back up to N. Correct on complete days. After N days without an app open, the evening reminder stops. With 2 reminders a day, the 64 cap allows about 30 days.
3. Hybrid: repeating morning plus one-off evenings (option 2). The morning never runs out. Only the evening has the N-day horizon.
4. Repeating evening, cancel on completion, re-add tomorrow's as a one-off. Behaves like option 2 with N = 1. One missed app open means no evening reminder until the next open.

Edge cases for options 2 to 4:

- Completion done somewhere the app's JS does not run (a second device, a future web app, or a widget action) does not cancel the local reminder.
- Un-completing a habit after the cancel must re-add today's reminder.
- If today's reminder time has passed, the queue must start tomorrow.

## Credentials, builds, Expo Go

- Local notifications need no APNs key, no FCM credentials, no push token and no EAS project setup. Apple's `add(_:)` call "schedules local notifications only" and needs only user permission ([Apple: Scheduling a notification locally](https://developer.apple.com/documentation/usernotifications/scheduling-a-notification-locally-from-your-app)). Push setup needs an APNs key, FCM V1 credentials and the EAS `projectId` ([push setup](https://docs.expo.dev/push-notifications/push-notifications-setup/)).
- Side effect to know about: the `expo-notifications` config plugin always adds `aps-environment` (`development`, Xcode switches it to `production` on archive) unless one exists (`plugin/build/withNotificationsIOS.js`). The App ID then needs the Push Notifications capability. `eas build` syncs capabilities with the Apple Developer portal automatically ([iOS capabilities](https://docs.expo.dev/build-reference/ios-capabilities/)). No APNs key is created by this.
- Native rebuild required: install with `npx expo install expo-notifications`, add the plugin to `app.json`, then build a new dev client (`development` profile) and a new TestFlight build (`preview-testflight`, `production`). A JS-only change cannot add it.
- `development` and `preview` share a bundle ID. On one device they are the same app, so pending notifications from one build survive an install of the other over it. Deleting the app clears them.
- Expo Go: "Local notifications (in-app notifications) remain available in Expo Go". Push is not available in Expo Go on Android since SDK 53. Expo Go for SDK 58 is not in the stores yet (CLI and `eas go` only) ([SDK 58 beta post](https://expo.dev/changelog/sdk-58-beta)). Orbii already runs as a dev client and the map says Expo Go is not a constraint.

## Interaction with the Live Activity

- No conflict found. The Live Activity is local: the app starts, updates and ends it through ActivityKit (`apps/mobile/src/live-activity/`). It uses no push.
- Live Activity permission is separate from notification permission. Live Activities are allowed by default; the user can turn them off in Settings ([Apple: ActivityAuthorizationInfo](https://developer.apple.com/documentation/activitykit/activityauthorizationinfo)). A user can deny notifications and still see the Live Activity, or the reverse.
- `expo-widgets` registers no `UNUserNotificationCenterDelegate`. SDK 58 `expo-notifications` forwards delegate calls to another library's delegate if one exists.
- Overlap: while the Live Activity is on the Lock Screen, the evening reminder repeats information the user can already see. A Live Activity lasts at most 8 hours active plus 4 on the Lock Screen ([Apple: Live Activities](https://developer.apple.com/documentation/activitykit/displaying-live-data-with-live-activities)), so a morning start does not reach a late evening.
- A local notification cannot update or end the Live Activity. Only the app or an ActivityKit push can.
- Tap routing: the Live Activity opens `/today` via `Linking.createURL`. A reminder tap needs its own handler (`addNotificationResponseReceivedListener` or `useLastNotificationResponse`) to route.

## Cases only server push covers

Server push here means Convex scheduler (`ctx.scheduler.runAt`, cancellable, up to 1000 scheduled calls per function, [docs](https://docs.convex.dev/scheduling/scheduled-functions)) plus an action calling the Expo push API (`https://exp.host/--/api/v2/push/send`, 100 messages per request, 600 per second per project, [docs](https://docs.expo.dev/push-notifications/sending-notifications/)).

- Skipping the evening reminder correctly with no app open for weeks. The server reads `daySessions` at fire time.
- Completion from somewhere other than this phone's JS.
- Content built from server state at fire time (for example, open habits or streak).
- Reminder time changes from another device.
- Updating or ending the Live Activity while the app is closed (needs ActivityKit push and `enablePushNotifications` on `expo-widgets`).

Cost of push: an APNs key on EAS, FCM V1 credentials for Android, push tokens stored per user in Convex, receipt checks, and per-user scheduling in `users.timezone`. It also depends on network, so it can arrive late or not at all.

## Implications for the decision

These are options and trade-offs for [#57](https://github.com/pedrotmr/orbii/issues/57), not rules.

| Option                                            | Skips evening on complete days  | Keeps working with no app opens     | Build cost                              |
| ------------------------------------------------- | ------------------------------- | ----------------------------------- | --------------------------------------- |
| A. Two repeating `DAILY` triggers                 | no                              | yes, forever                        | lowest                                  |
| B. Repeating morning, one-off evenings for N days | yes, if completed on this phone | morning forever, evening for N days | low                                     |
| C. One-off morning and evening for N days         | yes                             | both stop after N days              | low                                     |
| D. Server push from Convex                        | yes, from any client            | yes, forever                        | high (credentials, tokens, Convex jobs) |

Questions #57 has to answer:

- Is a wrong evening reminder on a complete day acceptable (A), or must it never happen (B, C, D)?
- If B or C, what N, and what happens on the day the queue runs out?
- Should the morning reminder skip when the Orbit is already set or committed? That has the same constraint as the evening one.
- Which time zone defines "8:00": the device or `users.timezone`? On Android, pinning to `users.timezone` means `DATE` triggers.
- Do Android reminders need minute precision? If yes, the exact alarm permission is a user-facing step.
- When to ask for permission, and what Settings shows after a denial.

Things to verify on a device before shipping:

- iOS `DAILY` behavior after a time zone change (sources disagree).
- That the `aps-environment` entitlement added by the plugin does not break the `preview-testflight` build or signing.
- That `setNotificationHandler` hides the reminder when the app is open and the Orbit is complete.
