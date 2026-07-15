# Implementation plan

Living, step-by-step plan for building Argus. **Update this file as work progresses** — check off tasks, add notes, link PRs/ADRs, and record decisions. It complements [ARCHITECTURE.md](ARCHITECTURE.md) (the "what") with the "how and in what order". Build/distribution details live in [PACKAGING.md](PACKAGING.md).

## How to use this file

- Each task has a checkbox. Mark `[x]` when done and add a short note (date / PR / ADR).
- Keep phase **exit criteria** honest — do not advance until met.
- When a `(default)` decision from ARCHITECTURE.md is confirmed or changed, write an ADR and link it here.
- Status legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked.

## Status snapshot

| Field | Value |
|-------|-------|
| Current phase | Phase 0 — planning docs |
| Last updated | 2026-07-14 |
| Next milestone | Phase 1 — plugin contract + SDK skeleton |
| Blockers | None |

---

## Phase 0 — Planning & docs

**Goal:** shared, written understanding before code.

- [x] Vision, development, plugin-system docs
- [x] Architecture doc with diagrams ([ARCHITECTURE.md](ARCHITECTURE.md))
- [x] This implementation plan
- [ ] Create `docs/adr/0001-*` for the first locked decision (template in `docs/adr/README.md`)
- [ ] Decide starting repo strategy: host + stub in this repo now; extract `argus-plugins` later (per ARCHITECTURE topology)

**Exit criteria:** architecture + plan reviewed; ready to scaffold.

---

## Phase 1 — Plugin contract & SDK skeleton

**Goal:** a typed, testable contract a stub plugin can implement — the foundation everything else depends on.

- [ ] Define media model DTOs: `MediaId`, `MediaItem`, `MediaDetails`, `Season`, `Episode`, `LiveEvent`, `Artwork`, `Person`
- [ ] Define `ArgusPlugin` interface + `HostContext` (http, secureStore, cache, log, settings)
- [ ] Define `PluginManifest` type + JSON Schema (id, version, apiVersion, capabilities, permissions, platforms, settingsSchema)
- [ ] Define `StreamDescriptor` + DRM info types
- [ ] Define error taxonomy (`AUTH_REQUIRED`, `GEO_BLOCKED`, `NOT_AVAILABLE`, `DRM_UNSUPPORTED`, `RATE_LIMITED`, `PLUGIN_ERROR`)
- [ ] Define capability enum + timeout constants
- [ ] Package as `@argus/plugin-sdk` (types only in v0), with `tsconfig`, build, and exports
- [ ] Contract fixture tests (validate a sample plugin object against the interface + manifest schema)
- [ ] Write ADR: **API language & contract shape** (TS interfaces confirmed)

**Exit criteria:** SDK builds; a fake object type-checks against `ArgusPlugin`; manifest schema validates a sample manifest.

---

## Phase 2 — Host shell (Expo RN TV)

**Goal:** a runnable TV app skeleton with navigation and screens, no real plugins.

### 2a. Scaffold
- [ ] Init Expo app with dev client, TypeScript, tvOS + Android TV targets
- [ ] Choose + integrate RN TV component/focus library; ADR: **TV UI library**
- [ ] Set up Zustand stores (search, library, plugins, player)
- [ ] Project structure by layer (presentation / application / domain / platform) per ARCHITECTURE
- [ ] Tooling: ESLint, Prettier/Biome, strict `tsconfig`, path aliases
- [ ] CI: typecheck + lint + unit tests on PR

### 2b. DRM spike (high risk — do early)
- [ ] Spike in-app playback with DRM on **tvOS** (FairPlay) and **Android TV** (Widevine)
- [ ] Evaluate: existing RN video lib vs custom Expo native module
- [ ] Play a clear HLS stream end-to-end; then a DRM-protected test stream
- [ ] Write ADR: **DRM player module** (record what works / limits / store implications)

### 2c. Screens (fixtures)
- [ ] Sidebar/rail navigation shell with focus management
- [ ] Home screen (rows from fixtures)
- [ ] Search screen (on-screen keyboard + results grid, debounced)
- [ ] Detail screen (unified layout for movie / episode / live event)
- [ ] Player screen wired to the player shell (clear stream first)
- [ ] Library screen (favorites / continue watching from local store)
- [ ] Settings screen (global + placeholder per-plugin)

### 2d. Build & distribution (see [PACKAGING.md](PACKAGING.md))
- [ ] Add `eas.json` with `development` / `preview` profiles (or local prebuild scripts)
- [ ] Android TV: produce a signed APK; install on a real device via `adb install`
- [ ] Manage Android upload keystore as a CI secret
- [ ] `ci.yml`: typecheck + lint + unit tests on PR (Linux runner)
- [ ] `build-android.yml`: build APK on tag/dispatch, upload artifact (EAS or Gradle); ADR: **build engine (EAS vs self-hosted)**
- [ ] Apple Developer Program enrollment + App Store Connect app record
- [ ] tvOS: TestFlight internal build via `eas build` + `eas submit` (or ad-hoc + Apple Configurator)
- [ ] `build-tvos.yml`: build + submit to TestFlight on tag/dispatch
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
- [ ] Build the **stub plugin** implementing search/getDetails/getPlayback/getLive against fixtures
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

## Phase 7 — Multi-repo extraction & first reference plugin

**Goal:** move to the target topology and prove the contributor path.

- [ ] Extract SDK to `argus-plugin-sdk`; publish `@argus/plugin-sdk`
- [ ] Extract plugins to `argus-plugins`; wire signed-build CI → `argus-repo-index`
- [ ] Stand up `argus-repo-index` (official `index.json` + artifact hosting)
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

| Date | Decision | ADR | Notes |
|------|----------|-----|-------|
| 2026-07-14 | Core stack, runtime, repos, trust, platforms (see ARCHITECTURE "Locked decisions") | — | Captured from planning Q&A |

---

## Risk register

| Risk | Impact | Mitigation |
|------|--------|------------|
| DRM unworkable under Expo on TV | High | Early spike (2b); fall back to custom native module or revisit playback scope |
| tvOS distribution friction (no sideload; needs paid Apple account + TestFlight) | Med | Enroll early; Android TV first for fast iteration ([PACKAGING.md](PACKAGING.md)) |
| EAS build quota/cost for TV + CI | Low | Start free tier; self-hosted Gradle for Android as fallback |
| Store rejects hot-updated JS plugins | High | Keep plugins JS-only; spike store policy before relying on OTA |
| In-process plugin crashes host | Med | Timeouts, error boundaries, circuit breaker; isolation ADR if needed |
| Multi-repo overhead for solo dev | Med | Start host+SDK together; extract plugins later |
| Federated search slow plugin | Med | Timeouts + partial results + loading UX |
