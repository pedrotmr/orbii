# Orbii mobile — SDK 58 preview development

Development setup for the SDK 58 preview, ahead of the planned 1–2 trusted-user dogfood. The app connects to the shared Convex **dev** deployment.

This branch currently targets **Expo SDK 58 preview** and React Native 0.88 RC.
Use a matching SDK 58 preview client; public App Store / Play Store Expo Go
builds targeting SDK 57 cannot open this project. The installed Clerk release
declares Expo support below SDK 58, and native sign-in has not been verified with
this preview. Trusted-user distribution remains blocked on runtime compatibility.

## Prerequisites

- Node 22.13+ on the 22 line, 24.3+ on the 24 line, or 26+; Node 23 and 25 are unsupported. CI uses Node 22.13.0. See the [SDK 58 runtime requirements](https://expo.dev/changelog/sdk-58-beta).
- [pnpm](https://pnpm.io/) 10
- Android device/emulator or iOS simulator with a matching SDK 58 preview Expo Go client installed through Expo CLI
- For a physical iPhone: Apple Developer Program access and TestFlight for the preview client installed through `eas go`
- Access to this repo and the Clerk / Convex projects (ask Pedro)
- Optional on the host machine: Expo CLI (`pnpm --filter @orbii/mobile start`)

## Clone and install

```bash
git clone git@github.com:pedrotmr/orbii.git
cd orbii
pnpm install
```

## Env files (do not commit)

### Mobile — `apps/mobile/.env.local`

Copy the template, then fill values from the team:

```bash
cp apps/mobile/.env.example apps/mobile/.env.local
```

| Variable                            | Where it comes from                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_CONVEX_URL`            | Convex dashboard → deployment → URL (`https://posh-otter-652.convex.cloud` for dev) |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API keys, or `clerk env pull` from `apps/mobile`                  |

Creator shortcut (already authorized):

```bash
cd apps/mobile
npx clerk env pull   # writes publishable key into local env tooling; copy into .env.local if needed
```

### Backend (host running Convex watch) — `packages/backend/.env.local`

Needed only on the machine that runs `convex dev`. See [`packages/backend/README.md`](../../packages/backend/README.md) for `CONVEX_DEPLOYMENT` / `CONVEX_URL` and selecting `pedrotr:orbii:dev`.

## Clerk checklist (one-time, project owner)

1. Enable **Native API**: [Clerk native applications](https://dashboard.clerk.com/~/native-applications)
2. Allow redirect URLs used by this app:
   - Custom scheme (dev client / future standalone): `orbii://oauth-callback`
   - **Expo Go** (what wave-1 dogfood uses): Clerk must also accept the `exp://` callback Expo generates. With the current code (`AuthSession.makeRedirectUri({ scheme: "orbii", path: "oauth-callback" })`), Expo Go typically emits something like `exp://<LAN-host>:8081/--/oauth-callback`. In Clerk → Native applications / redirect allowlist, add that exact URL for your LAN IP (or use Clerk’s Expo redirect helper / wildcard policy your org allows). Re-check by logging `redirectUrl` once from the device if SSO fails to return.
3. Convex JWT: enable Clerk’s **Convex** integration so the JWT template named `convex` exists
4. On the Convex deployment, set `CLERK_JWT_ISSUER_DOMAIN` to the Clerk Frontend API issuer (`pnpm exec convex env set CLERK_JWT_ISSUER_DOMAIN …` from `packages/backend`)

Without the `convex` JWT template + issuer domain, mobile can sign in with Clerk but Convex queries/mutations fail auth.

## Run

Terminal A — Convex (if you are pushing function changes):

```bash
pnpm --filter @orbii/backend dev
```

Terminal B — Expo:

```bash
pnpm --filter @orbii/mobile start
```

Or from the repo root:

```bash
pnpm dev
```

### Install and open the matching preview client

For an Android device/emulator or iOS simulator, let Expo CLI install/open the
client compatible with this project:

```bash
pnpm --filter @orbii/mobile android
# Or, on a Mac with an iOS simulator:
pnpm --filter @orbii/mobile ios
```

For a physical iPhone, run the following from `apps/mobile` and follow the EAS
instructions to install the preview client through TestFlight:

```bash
npx eas-cli@latest go
```

Then start Expo and open its QR code using that matching preview client. Sign in
with the same Expo account in the CLI and Expo Go when using the EAS client.
If a client matching this preview is unavailable, the public SDK 57 store client
is not a substitute. See [Expo's SDK 58 preview announcement](https://expo.dev/changelog/sdk-58-beta)
and [physical iOS setup](https://docs.expo.dev/get-started/set-up-your-environment/?device=physical&mode=expo-go&platform=ios).

### First launch

1. Sign in (Google, Apple, or email hosted flow)
2. Empty Orbit → Setup wizard (welcome → seed/add → capacity)
3. Land on **Today** → reveal → pick ≤ capacity → commit → complete
4. **Orbit** to add/remove habits; **Settings** for capacity, timezone, sign out

## Troubleshooting

| Symptom                                      | Likely fix                                                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| App crashes on boot about missing env        | Ensure `apps/mobile/.env.local` exists and Expo was restarted after editing                      |
| Clerk sign-in opens then fails redirect      | Allowlist Expo Go `exp://…/--/oauth-callback` (and `orbii://oauth-callback` for a future client) |
| Signed in but UI stuck / “Not authenticated” | Convex JWT template `convex` missing, or `CLERK_JWT_ISSUER_DOMAIN` unset on the deployment       |
| Stale bundle / weird UI                      | Shake device → Reload; or stop Expo and `pnpm --filter @orbii/mobile start -- -c`                |
| Wrong data / empty after schema change       | Dev deployment may have been reset; re-run Setup                                                 |
| Fonts flash system default                   | Expected briefly until Outfit loads; if permanent, check network / Expo Go can fetch font assets |

## Out of scope for wave 1

- Distributing an Orbii build through TestFlight / Play internal track (the preview Expo Go client above is a separate development prerequisite)
- Production Convex deployment
- Notifications, web app, smart scheduling

## Related

- Spec: [Orbii V1](https://github.com/pedrotmr/orbii/issues/15)
- Backend / Convex details: [`packages/backend/README.md`](../../packages/backend/README.md)
- Wayfinder: [issue #1](https://github.com/pedrotmr/orbii/issues/1)
