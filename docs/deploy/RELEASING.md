# Release the app

Use `main` plus short-lived feature branches. Once the required accounts and GitHub secrets are configured, a merge delivers the Dev app to staging. Production starts when you run its release command.

## Work locally

```bash
git switch main
git pull --ff-only
git switch -c feat/my-change
pnpm --filter @orbii/mobile dev
```

Develop with test services. Commit and push your branch, open a PR into `main`, and merge after CI passes. Delete the feature branch after merging. There is no `develop` branch.

The current app remains on Expo SDK 58 preview and React Native 0.88 RC. Installing release automation does not prove native sign-in or store delivery on that runtime; validate those on the first Dev build before inviting users.

## Deliver staging

A relevant push to `main` automatically:

1. Checks formatting, lint, types, backend tests, mobile tests, and release tests.
2. Deploys the staging Convex backend from that exact commit.
3. Checks the Dev app identity, test services, and installed native runtime.
4. Publishes an iOS update on `preview` when the existing TestFlight build is compatible. With a new version/runtime or no previous build, builds and uploads the Dev app to TestFlight.

For an update, reopen the installed Dev app to download it, then relaunch. For a new build, wait for Apple processing and install it in TestFlight. Test login, onboarding, core reads/writes, and the Orbit Live Activity with test accounts.

To request a fresh Dev TestFlight build yourself:

```bash
pnpm mobile:testflight:staging
```

Native changes without a version/runtime bump stop delivery. Change the public version in `apps/mobile/app.json` before merging an SDK upgrade, native dependency, plugin, permission, or other native configuration change. A compatible JavaScript change keeps the current version/runtime.

## Release production

1. Merge the finished work to `main` and test staging.
2. Set the public version in `apps/mobile/app.json` when needed; commit, merge, and test that version. EAS increments build numbers automatically.
3. Preview the selected release, then start it:

   ```bash
   pnpm mobile:testflight:production --dry-run
   pnpm mobile:testflight:production
   ```

4. Follow **Production TestFlight release** in GitHub Actions. It checks the selected commit, deploys the production backend, builds the production iOS app, and uploads that exact build ID to App Store Connect.
5. After Apple processing, install and test that production build through TestFlight. It uses live accounts and data.
6. In App Store Connect, create/select the store version, write What's New, choose the tested build, complete compliance details, and submit for App Review. Choose manual or phased release there.

The command prepares a production TestFlight build. App Review and the public App Store release remain separate Apple steps. Production backend deployment happens before the upload, so backend changes must support existing installed apps . Data migrations require their own plan.

Production mobile changes use TestFlight and App Review. Production OTA publishing is outside this standard workflow; add it separately only when there is a concrete need for candidate testing, promotion, and recovery.

## What the commands select

Both commands fetch the latest pushed `main` once and read its committed app version. You can run them from a feature branch; local edits and unpushed commits are excluded. Every job uses the selected full SHA. You do not type a hash, version, or notes for a normal release.

Optional flags:

- `--dry-run`: offline preview using your cached `origin/main`; fetch Git yourself first if that cache needs refreshing.
- `--ref <commit-or-tag>`: deliberately select another committed revision containing the current release tooling.
- `--version <version>`: assert the committed version, without overriding it.
- `--notes "Changes to test"`: override the automatic commit-subject notes. These notes are release records, not App Store What's New text.

GitHub manual forms also allow SHA and notes to remain blank; select the `main` workflow branch.

## Find failures and retry

GitHub Actions retains `backend-release-<environment>` and `mobile-release-<environment>` artifacts for 90 days. The mobile record includes commit, version, delivery, build ID/number or update IDs, and the completed stage.

- Checks failed: fix them on a feature branch and merge.
- Native compatibility failed: bump the app version/runtime and merge before retrying.
- Build failed: inspect its EAS logs, fix the cause, and rerun the release.
- Only submission failed: retrieve the exact build ID from the release artifact or EAS. From `apps/mobile`, run `pnpm dlx eas-cli@24.8.0 submit -p ios --profile preview-testflight --id <build-id> --wait` for Dev, or `--profile production` for production. Verify app identity first; never select an unrelated latest build.
- Upload succeeded but TestFlight is empty: check Apple processing, tester groups, compliance, and beta review in App Store Connect.

GitHub runs the checks and coordinates backend delivery. EAS handles native builds, submissions, and staging updates directly from the checked GitHub checkout. This avoids a second queue for EAS custom validation jobs. It follows [Expo's CI integration](https://docs.expo.dev/build/building-on-ci/).

One-time account and environment setup is in [DEPLOYMENT.md](./DEPLOYMENT.md).
