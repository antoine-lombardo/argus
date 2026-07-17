# Implementation plan

Living, step-by-step plan for building Argus. **Update this file as work progresses** — check off tasks, add notes, link PRs/ADRs, and record decisions. It complements [ARCHITECTURE.md](ARCHITECTURE.md) (the "what") with the "how and in what order". Build/distribution details live in [PACKAGING.md](PACKAGING.md).

## How to use this file

- Each task has a checkbox. Mark `[x]` when done and add a short note (date / PR / ADR).
- Keep phase **exit criteria** honest — do not advance until met.
- When a `(default)` decision from ARCHITECTURE.md is confirmed or changed, write an ADR and link it here.
- Status legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked.

## Status snapshot

| Field          | Value                                                     |
| -------------- | --------------------------------------------------------- |
| Current phase  | Phase 2 (2c done; 2b DRM spike wired, device verify open) |
| Last updated   | 2026-07-17                                                |
| Next milestone | Verify Widevine on Android TV; FairPlay on physical ATV   |
| Blockers       | FairPlay device verify (trying EZDRM public demo)         |

---

## Phase 0 — Planning & docs

**Goal:** shared, written understanding before code.

- [x] Vision, development, plugin-system docs
- [x] Architecture doc with diagrams ([ARCHITECTURE.md](ARCHITECTURE.md))
- [x] This implementation plan
- [x] ADR 0001: plugin contract — TS interfaces & in-process runtime ([0001](adr/0001-plugin-contract-ts-interfaces.md))
- [x] ADR 0002: multi-repo layout from the start — separate host / SDK / plugins / repo-index repos ([0002](adr/0002-multi-repo-layout.md))

**Exit criteria:** architecture + plan reviewed; ready to scaffold. **Met 2026-07-14.**

---

## Phase 1 — Plugin contract & SDK skeleton

**Goal:** a typed, testable contract a stub plugin can implement — the foundation everything else depends on.

- [x] Define media model DTOs: `MediaId`, `MediaItem`, `MediaDetails`, `Season`, `Episode`, `LiveEvent`, `Artwork`, `Person`
- [x] Define `ArgusPlugin` interface + `HostContext` (http, secureStore, cache, log, settings)
- [x] Define `PluginManifest` type + JSON Schema (id, version, apiVersion, capabilities, permissions, platforms, settingsSchema) — `manifestJsonSchema` export
- [x] Define `StreamDescriptor` + DRM info types
- [x] Define error taxonomy (`AUTH_REQUIRED`, `GEO_BLOCKED`, `NOT_AVAILABLE`, `DRM_UNSUPPORTED`, `RATE_LIMITED`, `PLUGIN_ERROR`) — `ArgusError`
- [x] Define capability enum + timeout constants (`Capability`, `DEFAULT_TIMEOUTS`, `API_VERSION`)
- [x] Create the `argus-plugin-sdk` repo; package as `@argus-tv/plugin-sdk` with `tsconfig`, build, and exports
- [x] Contract fixture tests — compile-time (fixture plugin type-checks against `ArgusPlugin`) + runtime (Vitest + Ajv manifest-schema validation in `test/manifest.test.ts`)
- [x] Write ADR: **API language & contract shape** (TS interfaces confirmed) — covered by [ADR 0001](adr/0001-plugin-contract-ts-interfaces.md); no separate ADR needed

**Exit criteria:** SDK builds ✅ ; a fake object type-checks against `ArgusPlugin` ✅ ; manifest schema validates a sample manifest ✅ . **Phase 1 met 2026-07-15** — `@argus-tv/plugin-sdk@0.1.0` published to npm (`next`).

---

## Phase 2 — Host shell (Expo RN TV)

**Goal:** a runnable TV app skeleton with navigation and screens, no real plugins.

### 2a. Scaffold

- [x] Init Expo app with dev client, TypeScript, tvOS + Android TV targets — `with-router-tv` example, upgraded to **Expo SDK 57** + `react-native-tvos@0.86-stable` (2026-07-15)
- [x] Choose + integrate RN TV focus: native `react-native-tvos` + host wrappers ([ADR 0004](adr/0004-tv-ui-focus.md)) (2026-07-16)
- [x] Set up Zustand stores (search, library, plugins, player) — stubs ready for 2c (2026-07-16)
- [x] Project structure by layer (presentation / application / domain / platform) per ARCHITECTURE (2026-07-16)
- [~] Tooling: ESLint, Prettier/Biome, strict `tsconfig`, path aliases — ESLint (`eslint-config-expo`) + strict `tsconfig` + `@/*` paths done; Biome/Prettier TBD
- [x] CI: typecheck + lint on PR (`ci.yml`) (2026-07-15)

### 2b. DRM spike (high risk — do early)

- [~] Spike in-app playback with DRM on **tvOS** (FairPlay) and **Android TV** (Widevine) — `toVideoSource` + Home DRM rail; Widevine/FairPlay device verify still open ([ADR 0006](adr/0006-player-expo-video.md))
- [x] Evaluate: existing RN video lib vs custom Expo native module — chose `expo-video` over RNV v7 (not TV-ready) / Bitmovin / custom module ([ADR 0006](adr/0006-player-expo-video.md); supersedes [0005](adr/0005-player-react-native-video.md)) (2026-07-17)
- [~] Play a clear HLS stream end-to-end; then a DRM-protected test stream — clear HLS verified; Widevine = Google Tears/UAT; FairPlay = EZDRM public demo (was Axinom); device verify open
- [x] Write ADR: **DRM player module** — [ADR 0006](adr/0006-player-expo-video.md) (library lock; DRM spike remains)

### 2c. Screens (fixtures)

- [x] Sidebar/rail navigation shell with focus management — dual `FocusGuide autoFocus` (sidebar + content); Up/Down changes route on focus; Right/Left handoff verified on Apple TV (2026-07-17)
- [x] Home screen (rows from fixtures) — `homeRows` / `MediaItem` from `@argus-tv/plugin-sdk`; Continue / Popular / Live rails (2026-07-17)
- [x] Search screen (on-screen keyboard + results grid, debounced) — `TvKeyboard` + fixture `searchFixtures`; 300ms debounce via `useSearchStore` (2026-07-17)
- [x] Detail screen (unified layout for movie / episode / live event) — `/detail` + `getFixtureDetails`; Home/Search posters navigate; Play stashes id in `usePlayerStore` (2026-07-17)
- [x] Player screen wired to the player shell (clear stream first) — `/player` + `expo-video` + fixture HLS; Detail Play / episodes push player ([ADR 0006](adr/0006-player-expo-video.md)) (2026-07-17)
- [x] Library screen (favorites / continue watching from local store) — seeded fixture rails + Detail navigation / focus restore (2026-07-17)
- [x] Settings screen (global + placeholder per-plugin) — autoplay / reduce-motion toggles + fixture plugin enable/disable (2026-07-17)

### 2d. Build & distribution (see [PACKAGING.md](PACKAGING.md))

- [x] Add `eas.json` with `development` / `preview` / `production` profiles (+ `*_tv` variants); versioning wired: Changesets for `expo.version`, EAS `autoIncrement` + `appVersionSource: remote` for build numbers ([ADR 0003](adr/0003-app-versioning.md)) (2026-07-15)
- [ ] Android TV: produce a signed APK; install on a real device via `adb install` — `build-host.yml` on `argus@*` tag (needs `EXPO_TOKEN`)
- [x] Link EAS project (`eas init`, `@argus-tv/argus`, `extra.eas.projectId` in `app.json`) (2026-07-15)
- [ ] Manage Android upload keystore as a CI secret — deferred; EAS manages credentials by default (`preview_tv` uses `withoutCredentials` for fast internal APKs)
- [x] `ci.yml`: typecheck + lint on PR (Linux runner) (2026-07-15)
- [x] `build-host.yml`: EAS Android TV + tvOS on `argus@*` tag / dispatch → artifacts + GitHub Release (2026-07-15)
- [x] `staging_tv` + `submit.staging`: store-signed builds → TestFlight internal + Play internal (`eas.json`, `build-host.yml`) (2026-07-15)
- [x] Apple Developer Program enrollment + App Store Connect tvOS app + `ascAppId` `6791784830` in `eas.json` (2026-07-16)
- [ ] Google Play Developer account + Play Console Android TV app + service account in EAS
- [x] tvOS: first TestFlight upload succeeded — build 10 IPA delivered via `altool -t appletvos` (2026-07-17); CI `submit-tvos` job (`macos-latest`) automates it with `ASC_API_KEY_*` secrets
- [x] tvOS: build 11 on TestFlight and installed on a physical Apple TV (2026-07-17)
- [ ] Android TV: first Play internal via **Build host app** (`staging_tv` + submit)
- [ ] (Optional) Firebase App Distribution for Android testers

**Exit criteria:** app runs on both TV platforms, navigates via D-pad, plays a clear stream, renders fixture data; a tagged commit produces installable Android TV + tvOS builds via GitHub Actions.

---

## Phase 3 — Plugin kernel & host services

**Goal:** load and safely call an in-process JS plugin through the contract.

- [ ] Plugin kernel: load bundle, instantiate, hold instance, enable/disable
- [ ] Call wrapper: per-call timeout, `AbortSignal`, error boundary, typed errors
- [ ] Circuit breaker: disable plugin after N failures, surface prompt
- [ ] Host services impl: HTTP client (timeout/retry), structured logger
- [ ] Per-plugin secure storage namespace (native keychain module); ADR: **secure storage**
- [ ] Per-plugin cache / KV store
- [ ] Settings access wired to plugin `settingsSchema`
- [ ] Build the **stub plugin** (in the `argus-plugins` repo) implementing search/getDetails/getPlayback/getLive against fixtures
- [ ] Host loads the stub plugin and renders its results in the real screens
- [ ] Federated search aggregator: parallel fan-out, partial results, timeout, dedup

**Exit criteria:** stub plugin drives Home/Search/Detail/Player through the kernel; a thrown plugin error is contained and shown gracefully.

---

## Phase 4 — Repository system

**Goal:** install/update/remove plugins from a repo index.

- [ ] Define `index.json` schema (repo meta + plugins + versions + hashes + signature refs); ADR: **repo index format**
- [ ] Repo manager: add/remove repo URLs, fetch + cache index
- [ ] Version resolution (apiVersion compatibility, platform match, newest/pinned)
- [ ] Download `.argus-plugin` artifact; verify sha256
- [ ] Install to plugin store; register with kernel; uninstall/cleanup
- [ ] Update check + "update available" flow
- [ ] Private repo support: user-added URL + optional bearer token
- [ ] Sideload local `.argus-plugin` (author flow)
- [ ] Conflict handling (same pluginId from two repos → user picks)
- [ ] Plugin registry UI: list, enable/disable, install, update, remove, per-plugin settings

**Exit criteria:** user adds a repo URL, installs the stub plugin from it, sees an update when the index bumps, and removes it.

---

## Phase 5 — Trust & signing

**Goal:** signed official plugins; safe handling of unsigned private plugins.

- [ ] Choose signing algo (Ed25519 default); ADR: **signing & trust**
- [ ] Signing tooling (CLI) to sign artifacts in `argus-plugins` CI
- [ ] Embed official public key in app + publish in index
- [ ] Verify signature on install; reject invalid/unsigned from public repo
- [ ] Private repo: allow unsigned with "unverified" badge + permission prompt
- [ ] Permission prompt UI from `manifest.permissions`
- [ ] (Design-only) version blocklist / revocation hook

**Exit criteria:** tampered/unsigned artifact is rejected from the official repo; private unsigned installs with an explicit warning.

---

## Phase 6 — Library, auth, and polish

**Goal:** unified library + provider auth + UX hardening.

- [ ] Host library storage (local DB); favorites + continue watching
- [ ] Continue-watching reconciliation (merge / max progress); ADR if semantics get complex
- [ ] Progress reporting to plugins that support it
- [ ] Auth flows: TV-friendly (device code / system browser) via plugin `login`; per-plugin session in secure namespace
- [ ] Auth-required + empty states (no plugins / not logged in)
- [ ] Live UX: "live now" row + event status/countdown
- [ ] Subtitle + audio track selection; resume; next episode
- [ ] i18n string catalog scaffolding; a11y pass (screen readers, focus order)

**Exit criteria:** end-to-end: install plugin → log in → browse/search → play (resume) → appears in library.

---

## Phase 7 — Publish SDK & first reference plugin

**Goal:** prove the contributor path on the multi-repo layout that already exists ([ADR 0002](adr/0002-multi-repo-layout.md)).

- [x] Release automation for `@argus-tv/plugin-sdk` (Changesets + GitHub Actions, npm provenance, `next` dist-tag) — see [PACKAGING.md](PACKAGING.md#sdk-npm-package-argus-tvplugin-sdk)
- [ ] First actual npm publish (needs `NPM_TOKEN` secret + org PR-permission enabled), then switch host/plugins off git-dep/`npm link`
- [ ] Harden `argus-plugins` signed-build CI → `argus-repo-index`
- [ ] Plugin template / `create-argus-plugin` (or documented copy-the-stub)
- [ ] One **reference plugin** against a legal/open API exercising the full contract
- [ ] Contributor docs: writing, building, signing, publishing a plugin

**Exit criteria:** a new plugin can be built against the published SDK and installed from the official repo.

---

## Backlog / later (post-v1)

- Phone + tablet layouts; web target
- Cloud sync for library across devices
- Marketplace / discovery UI for plugins
- Repo channels (stable/beta), plugin dependencies, rollback UX
- DVR / start-over for live; skip-intro
- Platform integrations: tvOS top shelf, Android TV Leanback recommendations
- Runtime isolation upgrade (worker/WebView) if in-process proves risky
- Remote logging, crash reporting, optional privacy-respecting analytics

---

## Decision log

Record confirmations/changes to `(default)` decisions here; link the ADR.

| Date       | Decision                                                                                                                                   | ADR                                               | Notes                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------- |
| 2026-07-14 | Core stack, runtime, repos, trust, platforms (see ARCHITECTURE "Locked decisions")                                                         | —                                                 | Captured from planning Q&A                                          |
| 2026-07-14 | Plugin contract: TS interfaces, in-process JS, hot-download, JS-only plugins v1                                                            | [0001](adr/0001-plugin-contract-ts-interfaces.md) | Phase 0 complete                                                    |
| 2026-07-14 | Multi-repo from day one: `argus` (host), `argus-plugin-sdk`, `argus-plugins`, `argus-repo-index`                                           | [0002](adr/0002-multi-repo-layout.md)             | Phase 0 complete; supersedes earlier phased-monorepo idea           |
| 2026-07-15 | `@argus-tv/plugin-sdk` skeleton: contract types, manifest JSON Schema, `apiVersion` `0.1`; ESM + TS, types-first (no runtime SDK coupling) | [0001](adr/0001-plugin-contract-ts-interfaces.md) | Phase 1 in progress; builds + fixture type-checks                   |
| 2026-07-15 | npm scope `@argus-tv` (bare `@argus` taken); publish `0.x` under `next` dist-tag; Changesets + Actions release automation with provenance  | —                                                 | See [PACKAGING.md](PACKAGING.md#sdk-npm-package-argus-tvplugin-sdk) |
| 2026-07-15 | Phase 1 complete: contract has compile-time (fixture) + runtime (Vitest/Ajv) tests; `@argus-tv/plugin-sdk@0.1.0` shipped                   | [0001](adr/0001-plugin-contract-ts-interfaces.md) | Next: Phase 2 host shell                                            |
| 2026-07-15 | Host scaffold: Expo SDK 57 + `with-router-tv` + `react-native-tvos@0.86-stable`; `npm overrides` for TV fork peer resolution               | —                                                 | Phase 2a started                                                    |
| 2026-07-15 | Host app versioning: Changesets owns `expo.version` (via `app.config.js`, private/no-publish, tags `argus@<version>`); EAS owns build number (`autoIncrement`, `appVersionSource: remote`) | [0003](adr/0003-app-versioning.md) | Mirrors SDK's Changesets flow |
| 2026-07-15 | CI + EAS build workflows: `ci.yml`, `build-host.yml` on `argus@*` tag; EAS default over self-hosted Gradle/Xcode | — | `EXPO_TOKEN` + `@argus-tv/argus` EAS project linked |
| 2026-07-15 | Staging distribution: `staging_tv` build + `submit.staging` (TestFlight internal + Play internal); tags stay on `preview_tv` APK | — | Needs Apple + Google developer accounts |
| 2026-07-16 | TV focus: native `react-native-tvos` primitives + thin host wrappers; reject JS spatial-nav for v1 | [0004](adr/0004-tv-ui-focus.md) | Phase 2a focus + layers + Zustand stubs |
| 2026-07-17 | tvOS TestFlight delivery via `xcrun altool -t appletvos` (not `eas submit`, which mis-tags tvOS as iOS → ITMS-90508/90545/90713/90039); CI `submit-tvos` job on `macos-latest` + `ASC_API_KEY_*` secrets | — | Proven by re-uploading rejected build 10; Android still uses `eas submit` |
| 2026-07-17 | Phase 2c: Netflix-style `AppShell` — dual `FocusGuide autoFocus` (sidebar + content); Up/Down navigates on focus; no nextFocus/ref wiring. Verified on Apple TV | [0004](adr/0004-tv-ui-focus.md) | Next: Home fixture rows |
| 2026-07-17 | Home fixture rows: `@argus-tv/plugin-sdk` `Row`/`MediaItem` fixtures + Rail titles + Poster artwork (`expo-image`) | — | Next: Search screen |
| 2026-07-17 | Search: in-app `TvKeyboard` + debounced fixture catalog filter + `PosterGrid` (no native searchable module yet) | — | Next: Detail screen |
| 2026-07-17 | Detail: unified `/detail` for movie/series/episode/live fixtures (`MediaDetails`); Play → player store until Player screen | — | Next: Player screen |
| 2026-07-17 | Root `Stack`: `(shell)` (sidebar + tabs) stays mounted under full-screen `detail`; Back pops Detail over the whole UI including sidenav | [0004](adr/0004-tv-ui-focus.md) | Avoids remount/scroll jump on Back |
| 2026-07-17 | Player: briefly tried RNV v7; **not TV-ready** (podspecs `:ios` only) — superseded by `expo-video` + host chrome; clear HLS fixtures | [0005](adr/0005-player-react-native-video.md) → [0006](adr/0006-player-expo-video.md) | Rebuild native (`prebuild:tv` / `run:ios`); DRM + HLS rewrite transport later |
| 2026-07-17 | Phase 2c complete: Library (continue + favorites from store) + Settings (global toggles + plugin enable placeholders) | — | Next: DRM spike (2b) or player chrome polish |
| 2026-07-17 | DRM spike plumbing: `StreamDescriptor` → expo-video `VideoSource.drm`; Home rail Widevine (Shaka/CWIP) + FairPlay placeholder | [0006](adr/0006-player-expo-video.md) | Verify WV on Android TV; FPS on device with real cert |
| 2026-07-17 | FairPlay fixture: EZDRM public demo (`ezdrm.m3u8` + license UUID + `eleisure.cer`) | [0006](adr/0006-player-expo-video.md) | Verify FPS on physical Apple TV |
| 2026-07-17 | Widevine fixture: same vendor — EZDRM Big Buck Bunny DASH + `proxy?pX=E0183F` (replaces Shaka/CWIP) | [0006](adr/0006-player-expo-video.md) | Verify WV on Android TV / emulator |
| 2026-07-17 | EZDRM demos did not play; swapped fixtures → Widevine Google Tears/UAT; FairPlay Axinom + FPS cert + token | [0006](adr/0006-player-expo-video.md) | Re-verify on Android TV emulator + physical ATV |
| 2026-07-17 | FairPlay fixture hardened: Axinom CMAF cbcs, header-only token, embedded FPS cert, surface player errors | [0006](adr/0006-player-expo-video.md) | Re-test on physical Apple TV; note on-screen error if still fails |
| 2026-07-17 | FairPlay DRMLoadException on ATV with Axinom; swapped fixture → EZDRM Shaka demo + contentId uuid | [0006](adr/0006-player-expo-video.md) | Re-test on physical Apple TV |
| 2026-07-17 | App branding: Argus eye mark replaces Expo template icons (iOS/Android adaptive/splash + TV stack/topshelf) | — | Needs native rebuild / next TestFlight to show on ATV |
| 2026-07-17 | Brand mark locked from user SVG (`icon-mark.svg`); warm stone gradient icon set | — | Native rebuild / TestFlight for ATV home icon |
| 2026-07-17 | Regenerated all icons from `assets/brand/icon-mark.svg` via `scripts/generate-icons.mjs` (app/adaptive/splash/TV) | — | Native rebuild / TestFlight to see ATV home icon |
| 2026-07-17 | In-app `BrandLogo` uses SVG paths (`BrandMarkSvg` + `react-native-svg`); sidebar + Settings About | — | Native rebuild if `react-native-svg` not linked yet |
| 2026-07-17 | Removed Expo template assets (`expo.icon`, logos, badges, tabIcons, glow) + unused `WebBadge` | — | Assets tree is Argus-only |

---

## Risk register

| Risk                                                                            | Impact | Mitigation                                                                                                                              |
| ------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| DRM unworkable under Expo on TV                                                 | High   | Early spike (2b); fall back to custom native module or revisit playback scope                                                           |
| tvOS distribution friction (no sideload; needs paid Apple account + TestFlight) | Med    | Enroll early; Android TV first for fast iteration ([PACKAGING.md](PACKAGING.md))                                                        |
| EAS build quota/cost for TV + CI                                                | Low    | Start free tier; self-hosted Gradle for Android as fallback                                                                             |
| Store rejects hot-updated JS plugins                                            | High   | Keep plugins JS-only; spike store policy before relying on OTA                                                                          |
| In-process plugin crashes host                                                  | Med    | Timeouts, error boundaries, circuit breaker; isolation ADR if needed                                                                    |
| Multi-repo overhead for solo dev                                                | Med    | Keep each repo minimal; automate releases; use `npm link`/git deps for fast local iteration ([ADR 0002](adr/0002-multi-repo-layout.md)) |
| Federated search slow plugin                                                    | Med    | Timeouts + partial results + loading UX                                                                                                 |
