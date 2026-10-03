# Deployment setup

Everyday commands are in [RELEASING.md](./RELEASING.md). Product decisions remain in [Spec #15](https://github.com/pedrotmr/orbii/issues/15); this reference only documents account wiring.

## Orbii identities

| Setting                          | Dev / staging                                               | Production                                                               |
| -------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| Expo project                     | `@peedrotmr/orbii` (`cebd63af-63fc-4c5a-a302-dbae0bdcd6e8`) | Same project                                                             |
| iOS bundle ID                    | `app.orbii.mobile.dev`                                      | `app.orbii.mobile`                                                       |
| App name / scheme                | Orbii Dev / `orbiidev`                                      | Orbii / `orbii`                                                          |
| EAS store profile                | `preview-testflight`                                        | `production`                                                             |
| EAS environment / update channel | `preview`                                                   | `production`                                                             |
| Apple team                       | `YW25U2BJ23`                                                | Same team                                                                |
| App Store Connect ID             | `6817832044`                                                | Missing: fill `submit.production.ios.ascAppId` in `apps/mobile/eas.json` |
| Convex                           | `posh-otter-652` (`https://posh-otter-652.convex.cloud`)    | Missing: set `productionConvexUrl` to a verified distinct deployment     |
| Clerk                            | Existing test instance                                      | Configure and verify the live instance                                   |

App version lives in `apps/mobile/app.json`; resolved runtime is that same version. EAS owns remotely incremented build numbers. The first update-enabled runtime is `0.2.0`, requiring a new Dev store build. Existing `0.1.0` TestFlight builds have no update runtime/channel and cannot receive this flow's OTA updates. SDK 58 preview stays pinned.

## Complete account wiring before delivery

1. Confirm both Apple app records and numeric IDs. Add the production ID to `eas.json`; never use the Dev ID for production.
2. Configure separate staging/production Convex deployments and Clerk test/live instances. Set matching `EXPO_PUBLIC_CONVEX_URL` and `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` in EAS `preview` and `production`, using plaintext or sensitive visibility. Public client variables are embedded in the app; server secrets belong in Convex. Pin those exact URLs as `stagingConvexUrl` and `productionConvexUrl` in `release.config.json`. The release guard rejects a different backend URL and test/live Clerk mismatches before backend deployment. Production stays disabled until its distinct URL is configured.
3. Enable Clerk Native API and allow `orbiidev://oauth-callback` on the test instance and `orbii://oauth-callback` on the live instance. Preserve local Expo Go callbacks for development. Enable the Convex JWT template and set each deployment's matching `CLERK_JWT_ISSUER_DOMAIN`. Orbii does not use Clerk user-sync webhooks; do not add one for release tooling.
4. Configure EAS signing and an App Store Connect API key for non-interactive submission for both identities. Keep capability sync enabled: Expo Widgets creates `group.app.orbii.mobile.dev` and `group.app.orbii.mobile` and their extensions. Confirm provisioning supports these app groups and Live Activities. Prove each profile's build and exact submission before claiming automated TestFlight delivery.
5. Add GitHub repository secrets `EXPO_TOKEN`, `CONVEX_DEPLOY_KEY_DEVELOP` for staging, and `CONVEX_DEPLOY_KEY` for production. Keys must target the deployments matching the EAS public URLs. The staging workflow never falls back to the production key. Create GitHub `staging` and `production` environments and configure the owner's desired protection rules.
6. Merge the three release workflows onto `main` only when staging setup is ready: relevant main pushes start staging delivery automatically. Require CI before merging. Production is manually dispatched and deploys its backend before native upload; backend changes must support installed clients and migrations need a separate plan.
7. Simulator builds use `preview-simulator`, so staging updates do not replace the commit being tested. Confirm the EAS `preview` channel points only to the `preview` branch with no rollout or pause. The first store build establishes its channel. Test login, setup, Orbit reads/writes, and Live Activity on the new Dev build. Apple processing, tester groups, compliance, and beta review are separate steps after upload.

## Verified setup status (2026-10-03)

Repository secret and GitHub environment inventories were empty. EAS preview contains both required public client variable names; production contains neither. The production App Store Connect ID and pinned `productionConvexUrl` are absent; production stops before backend deployment until both are committed and its EAS client variables are configured. EAS account/project access is available, and finished Dev builds exist at `0.1.0` without update runtime/channel. These checks do not prove signing/submission credentials or Apple tester access. No live release or backend deployment was run while preparing this tooling PR.

Use the EAS CLI version in `release.config.json`. Recheck EAS environment variables with `pnpm dlx eas-cli@<configured-version> env:list preview --format long` and `env:list production --format long` from `apps/mobile`; avoid printing sensitive values in shared logs. Check repository secret names with `gh secret list --repo pedrotmr/orbii`.

Direct EAS CLI integration follows [Expo's CI guide](https://docs.expo.dev/build/building-on-ci/) and [environment guide](https://docs.expo.dev/eas/environment-variables/). Update URL/runtime configuration follows [Expo Updates](https://docs.expo.dev/versions/latest/sdk/updates/).
