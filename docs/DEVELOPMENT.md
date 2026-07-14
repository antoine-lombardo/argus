# Development plan

How Argus will be built. This is a plan, not a commitment to dates or stack locks.

## Current phase: foundation docs

Deliverable: shared understanding in markdown (this folder, README, AGENTS).

**Exit criteria:** vision, phases, and plugin open questions are written and agreed enough to start an ADR or spike.

## Phases

### 1. Plugin contract (design)

Decide—or deliberately leave provisional:

- Media model (movie, series, season, episode, live event, channel)
- Catalog / search / auth / playback capability surfaces
- How plugins are packaged, versioned, and permissioned
- What “playback” means when DRM or TOU forbid in-app play

**Artifacts:** `docs/PLUGIN-SYSTEM.md`, then ADRs under `docs/adr/` as decisions land.

**Exit criteria:** a written contract stable enough to implement a stub plugin against (even if v0 is imperfect).

### 2. App shell (React Native)

Scaffold the host: navigation, placeholder library/search/detail/player screens, plugin registry UI (list / enable / disable), settings.

No real providers required—fixtures or a stub plugin are enough.

**Exit criteria:** runnable RN app that loads a stub plugin and shows normalized entities in the UI.

### 3. Plugin lifecycle + repositories

Install / update / remove from a repo index; support at least one public-shaped and one private/local-shaped source.

**Exit criteria:** user can add a repo, install a plugin, and see it appear in the registry.

### 4. Reference plugins

One or more **reference** plugins (open APIs, sample data, or document-only commercial stubs) that exercise the full contract without legal risk.

**Exit criteria:** end-to-end flow documented for contributors writing a new plugin.

### 5. Real providers (selective)

Provider work happens only where the plugin can use legitimate access (official APIs, partner SDKs, or user-authorized flows). Expect uneven support (deep-link-only vs in-app).

## Working agreements

- **Docs and ADRs before large code** while architecture is open
- **Small vertical slices** once coding starts (stub → UI → one lifecycle feature)
- **Core stays provider-agnostic**; provider code lives in plugin packages/repos
- **No secrets in git**; no credentialed scrapers as “features”
- **Plugin system is the hard problem**—spike isolation, updates, and crash containment early

## Suggested tooling (not finalized)

| Area | Direction |
|------|-----------|
| Client | React Native (TypeScript expected) |
| Monorepo vs multi-repo | Undecided; may keep host here and plugins elsewhere |
| CI | Once code exists: lint, typecheck, tests on PRs |
| Docs | Markdown in-repo; ADRs for locking decisions |

Exact packages, state management, and navigation libraries will be chosen at scaffold time—not before.

## Local contribution flow (when code exists)

Typical loop (subject to change):

1. Read AGENT / vision docs and open ADRs  
2. Propose or update an ADR if the change is architectural  
3. Implement against the plugin contract  
4. Add or update tests for contract + host behavior  
5. PR with a short note on impact to plugins or repos  

Until code lands, PRs can be documentation-only.
