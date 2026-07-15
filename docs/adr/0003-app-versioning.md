# Host app versioning: Changesets for version, EAS for build number

Date: 2026-07-15
Status: Accepted

## Context

The `argus` host app is an Expo/EAS application, not a published npm package. It
has **two independent version numbers** that are frequently conflated:

- **Marketing version** (`expo.version`) — human/store facing, changes per
  release (e.g. `0.1.0`).
- **Build number** (`ios.buildNumber` / `android.versionCode`) — must be unique
  and monotonic for **every** binary uploaded to TestFlight / Play, changes on
  every build.

The sibling `argus-plugin-sdk` repo already uses [Changesets](https://github.com/changesets/changesets)
to drive its semver + changelog ([PACKAGING.md](../PACKAGING.md#sdk-npm-package-argus-tvplugin-sdk)).
We want a consistent, automated flow across repos without misusing an
npm-publish tool for native binaries.

Options considered:

- **Changesets for the marketing version + EAS `autoIncrement` for the build
  number** (chosen).
- **release-please** (conventional commits) — standard for apps, but a second
  mental model alongside the SDK's Changesets.
- **Plain git tags, no changelog tooling** — simplest, but loses the automated
  changelog the SDK already enjoys.

## Decision

**Split ownership of the two numbers:**

1. **Marketing version → Changesets.** `package.json` `version` is the single
   source of truth. `app.config.ts` reads it and sets `expo.version`, so the
   version is never hand-edited in `app.json`. The package stays
   `"private": true`; Changesets is configured with
   `privatePackages: { version: true, tag: true }` so it **versions and tags but
   never publishes to npm**.
2. **Build number → EAS.** `eas.json` sets `cli.appVersionSource: "remote"` and
   `autoIncrement: true` on the `preview` and `production` profiles (the `*_tv`
   profiles inherit). EAS owns `buildNumber` / `versionCode` remotely; no commit
   is needed per build and TestFlight collisions are avoided.
3. **Release trigger → the merged version PR.** On `main`, the **Release**
   workflow (`.github/workflows/release.yml`) opens/updates a
   **"chore: version packages"** PR via `changesets/action`. Merging it bumps
   `package.json` + `CHANGELOG.md` and runs `changeset tag`, creating and
   pushing the `argus@<version>` git tag. That tag is the intended trigger for
   the (future) EAS build workflows ([plan phase 2d](../IMPLEMENTATION-PLAN.md)).

## Consequences

**Positive**

- One mental model across repos: *add a changeset → merge the version PR.*
- The two version numbers never collide; each is owned by the tool best suited
  to it.
- Automated changelog for the app; zero manual build-number bookkeeping.

**Negative / mitigations**

- Changesets doesn't understand `app.json`; the version indirection lives in
  `app.config.ts`. *Mitigation:* a 3-line wrapper, documented here and in
  `.changeset/README.md`.
- `appVersionSource: "remote"` requires an EAS project (`eas init`) before the
  first build. *Accepted:* build/submit wiring is a later phase-2d task; the
  config is correct in advance.
- Git tags use Changesets' `name@version` form (`argus@0.2.0`), not `v0.2.0`.
  *Accepted:* the EAS build workflows will match `argus@*`.

**Does not change**

- The SDK's release process ([PACKAGING.md](../PACKAGING.md#sdk-npm-package-argus-tvplugin-sdk))
  — that package still publishes to npm; only the host app's (non-publishing)
  flow is decided here.
