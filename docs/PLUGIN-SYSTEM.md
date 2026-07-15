# Plugin system

Goal: each streaming provider is a **plugin**. The Argus host discovers plugins from **repositories** (public and private), installs them, and talks to them through a stable API.

This document captures **intent and open questions**. Nothing here is a final API. For the decisions taken during planning and the concrete design (contract sketch, packaging, repo/index format, trust, DRM), see [ARCHITECTURE.md](ARCHITECTURE.md); for the build order see [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md).

## Inspiration

Kodi-style ecosystem:

- Host application with a generic UI and player shell
- Add-ons that implement provider-specific behavior
- Repositories that list, version, and distribute add-ons
- Users can add unofficial / private repos

Differences to keep in mind: mobile sandboxes, DRM, app-store policies, and React Native packaging are not desktop Python add-ons. The *product* metaphor can match Kodi without the same technical mechanism.

## Responsibilities

### Host (Argus)

- Present unified browse, search, library, and detail UI
- Aggregate/normalize plugin results for display
- Own plugin lifecycle UI and trust prompts
- Provide a player shell and/or deep-link handoff
- Enforce permissions and capability negotiation

### Plugin (provider)

- Auth / identity for that service (if any)
- Fetch and map catalog data into Argus media types
- Search within the provider
- Resolve watch action (stream descriptor, deep link, or “not available”)
- Live schedules / events when relevant

### Repository

- Publish a machine-readable index of plugins (id, version, platforms, checksums/signatures TBD)
- Support public curated feeds and private/user-supplied feeds
- Enable update discovery

## Media types (target)

Plugins should eventually describe at least:

| Type | Notes |
|------|--------|
| Movie | Single title VOD |
| Series | Container for seasons/episodes |
| Season / Episode | Hierarchical series model |
| Live event | Time-bound (e.g. sports game) |
| Channel / live stream | Continuous linear or 24/7 feed (later OK) |

Exact schema is TBD; prefer versioned DTOs once we spike.

## Capability model (sketch)

Plugins advertise capabilities so the UI can adapt:

- `auth` — login / session required
- `catalog` — browse trees or home rows
- `search` — text search
- `vod` — movies / series playback resolution
- `live` — events or channels
- `deepLink` — open official app / web when in-app play is impossible
- `library` — watchlist / continue watching sync (optional)

A plugin that only supports search + deep link is still valid.

## Open questions (must resolve before heavy implementation)

1. **Runtime** — JS bundle in-process? Isolated process? Remote plugin? Native module per provider? Hybrid?
2. **Sandbox & crash isolation** — How does a bad plugin fail without taking down the app?
3. **Updates** — Hot-update plugins vs full app store releases?
4. **Signing / trust** — Required for public repos? Optional for private?
5. **DRM & store policy** — What can ship on App Store / Play while remaining useful?
6. **Monorepo vs plugin repos** — Core-only here, plugins elsewhere?
7. **API language** — TypeScript interfaces, JSON-RPC, schema registry?
8. **Offline / cache** — Who owns metadata cache: host, plugin, or both?

When a question is decided, add an ADR under `docs/adr/` and link it here.

## Repositories (public vs private)

| | Public | Private |
|---|--------|---------|
| Discoverability | Index intended for broad install | URL or file known to the user/org |
| Trust | Higher bar (signing, review—TBD) | User accepts risk |
| Content | Reference plugins, vetted community | Custom providers, internal tools |
| Lifecycle | Same install/update primitives | Same primitives |

Both should use the **same repo format** so the host does not special-case private sources beyond trust UI.

## Near-term design work

1. Draft v0 TypeScript (or schema) types for media entities + plugin manifest  
2. Define minimal methods: `initialize`, `search`, `getDetails`, `getPlayback`, `getLive`  
3. Implement a **stub plugin** that returns fixture data  
4. Spike one packaging/loading approach on React Native and document findings in an ADR  

No production provider work until (1)–(3) exist.
