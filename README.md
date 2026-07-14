# Argus

One place for every stream.

Argus is a React Native app that connects to streaming providers through **plugins**—Netflix, Prime Video, NHL, and more—and presents series, movies, and live events in a single experience. Browse, search, and watch without jumping between apps.

Think of it like [Kodi](https://kodi.tv/) for modern streaming: a thin client core, with content and auth living in plugins.

## Goals

- **Unified library** — one browse/search surface across providers
- **All media types** — movies, series (seasons/episodes), live events, and channels over time
- **Plugin-based providers** — each service is a plugin, not hard-coded into the app
- **Public and private plugin repos** — community and first-party catalogs, plus private/local sources (Kodi-style)
- **Cross-platform** — React Native as the client foundation (mobile first; other targets TBD)

## Non-goals (for now)

- Implementing provider plugins or DRM playback in this repo until the plugin contract exists
- Bundling credentials or reverse-engineered APIs for commercial services
- Shipping a finished plugin marketplace on day one

## Architecture (intended)

```
┌─────────────────────────────────────────┐
│              Argus app (RN)             │
│  UI · player shell · search · library   │
└─────────────────┬───────────────────────┘
                  │ plugin API (TBD)
┌─────────────────▼───────────────────────┐
│     Provider plugins (per service)      │
│  auth · catalog · resolve stream · live │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│     Plugin repositories (public/private)│
│  discover · install · update · trust    │
└─────────────────────────────────────────┘
```

### Core app

Owns navigation, UX, library aggregation, player shell, settings, and plugin lifecycle (install, enable, update, permissions). It should stay provider-agnostic.

### Plugins

Each provider plugin is responsible for:

- Authentication / session (where applicable)
- Catalog (titles, seasons, episodes, live schedules)
- Search and metadata normalization into Argus types
- Stream / playback URL resolution (or deep-link handoff, depending on feasibility)
- Live events and channels when the provider supports them

### Plugin repositories

Similar to Kodi add-on repos:

| Kind | Purpose |
|------|---------|
| **Public** | Curated / community catalogs people can install from |
| **Private** | Personal, enterprise, or unpublished sources |

Repo details (signing, trust, update channels) are **open design questions**—see [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Status

**Documentation-only.** No application code yet. Next work is to lock the product shape and design the plugin system before writing React Native scaffolding.

## Docs

| Doc | What it covers |
|-----|----------------|
| [docs/VISION.md](docs/VISION.md) | Product vision and principles |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | How we plan to build Argus |
| [docs/PLUGIN-SYSTEM.md](docs/PLUGIN-SYSTEM.md) | Plugin design goals and open questions |
| [AGENTS.md](AGENTS.md) | Guidance for coding agents |

## License

TBD.
