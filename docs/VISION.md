# Vision

## Problem

Streaming is fragmented. People hold multiple subscriptions (video on demand, sports, niche live) and still bounce between apps to find what to watch. Each app has its own browse model, search, and watchlist. There is no durable personal hub that *composes* those services instead of replacing them.

## Product

Argus is that hub: a single React Native client where installed **provider plugins** feed one catalog experience. Users browse and search across services, open movies and series, and follow **live events**, using accounts they already have—without Argus needing to own every provider’s backend.

Inspiration (conceptually, not as a clone):

- **Kodi** — add-ons, repositories, thin host
- **Unified watch apps / aggregators** — one browse plane over many sources

## Principles

1. **Plugins over features** — Prefer a capable plugin API + one more plugin over baking a provider into core.
2. **Honest capabilities** — Not every service will support the same playback path (in-app stream vs deep link vs unsupported). Surface limits clearly.
3. **Trust and consent** — Installing a plugin or adding a private repo is a user decision; permissions should be explicit.
4. **Legal by design** — Argus is a client + plugin host. Plugins that access commercial APIs or DRM content must use legitimate means. This project will not document or implement circumvention.
5. **Public + private ecosystems** — Community and official repos for discoverability; private repos for personal or closed distributions—same install/update mental model.
6. **Progressive media coverage** — Ship a solid VOD + series model first if needed; deepen live/sports as the plugin contract proves out.

## Success looks like

- Installing a provider plugin and seeing its catalog in the shared UI within minutes
- Searching once and getting cross-provider results with clear provenance
- Watching a live game or a series episode through the same shell, via whatever path that plugin supports
- Adding a private repo URL and using the same lifecycle as public repos

## What we are not building (yet)

- A single closed CDN or “Argus streaming service” that rehosts content
- Guaranteed parity with every official provider app feature on day one
- A decided plugin runtime (JS, native modules, WASM, remote—**open**; see PLUGIN-SYSTEM.md)
