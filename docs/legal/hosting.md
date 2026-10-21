# Privacy policy hosting decision (draft)

App Store Guideline **5.1.1(i)** needs:

1. A **stable HTTPS URL** in App Store Connect metadata
2. The same (or equivalent) policy **easily accessible inside the app**

This repo currently has **no** public privacy URL. The drafts live at `docs/legal/privacy-policy.*.md`. **Do not publish** until counsel review; this file only records options and a recommended path for V2.

## Options

| Option                    | How                                                                                                                    | Pros                                                                    | Cons                                                                                                                                                           | Fits ASC URL? | Fits in-app?                              |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ----------------------------------------- |
| **A. GitHub Pages**       | Enable Pages on `pedrotmr/orbii` (or a small `orbii-legal` repo); publish rendered HTML or Markdown from `docs/legal/` | Free, versioned with git, enough for TestFlight / early store           | Depends on GitHub availability; Markdown Pages UX is plain unless you add a theme; public forever once enabled                                                 | Yes           | Link out to URL (Safari / in-app browser) |
| **B. Own site**           | Host on a domain you control (e.g. `orbii.app/privacy`)                                                                | Clean brand URL; language switcher; easiest long-term for store listing | Needs domain, hosting, deploy pipeline; overkill if V2 stays invite-only                                                                                       | Yes (best UX) | Same as A                                 |
| **C. In-app screen only** | Render Markdown / static copy in Settings → Privacy                                                                    | No external host; works offline                                         | **Does not** satisfy App Store Connect’s privacy policy **URL** field by itself; reviewers still expect a linkable policy; harder for users to share / archive | No (alone)    | Yes                                       |

## Recommendation (V2)

**Use A + in-app link (not C alone).**

Recorded on the canonical Spec V2 issue ([#50](https://github.com/pedrotmr/orbii/issues/50)) so product decisions stay in Issues, not only in this tree.

1. After **[LAWYER]** review, publish EN + PT-BR to a public HTTPS URL (GitHub Pages is enough for invite/TestFlight). Prefer paths like `/privacy` (EN) and `/privacidade` or `/privacy/pt-BR`.
2. Add a Settings row in the app that opens that URL (satisfies “easily accessible within the app”). Optionally also show a short offline summary, but the canonical text should match the hosted version.
3. Plan **B** when/if a public brand site exists; keep the same path structure so the ASC URL does not churn.
4. Do **not** rely on raw `github.com/.../blob/...` links for ASC — they are awkward, can change with branch renames, and are a poor user experience. Pages (or your own site) is the durable URL.
5. Ship **in-app account deletion** before any App Store submission that supports accounts (Apple 5.1.1(v)); counsel cannot waive that requirement.

## Out of scope for this PR

- Enabling GitHub Pages
- Deploying HTML
- Adding the Settings deep link
- Pasting any URL into App Store Connect
- Sending the draft to anyone outside this repo

## Acceptance for “hosted”

- [ ] Counsel-approved EN + PT-BR text
- [ ] Public HTTPS URL returns the policy without login
- [ ] ASC metadata field set (when you are ready to distribute)
- [ ] In-app Settings entry opens the URL
- [ ] In-app account deletion shipped before App Store submission with accounts (**5.1.1(v)**; not waivable by counsel)
