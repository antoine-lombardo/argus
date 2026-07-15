# Multi-repo layout from the start

Date: 2026-07-14  
Status: Accepted

## Context

The target ecosystem is Kodi-like: a host app, a published plugin SDK, official plugins, and a repo index, each evolving on its own cadence ([ARCHITECTURE.md](../ARCHITECTURE.md#repository-topology)). We considered starting as a single monorepo and extracting later, but chose to keep repositories separate from the beginning to avoid a disruptive extraction migration and to force a clean, published contract boundary early.

## Decision

Use **separate repositories from day one**. No monorepo phase.

| Repo | Purpose | Notes |
|------|---------|-------|
| `argus` (this repo) | Host TV app (Expo RN) + product/process docs | Consumes `@argus/plugin-sdk` |
| `argus-plugin-sdk` | Contract types, manifest schema, contract tests, plugin template | Published as `@argus/plugin-sdk` |
| `argus-plugins` | Official + stub/reference plugins | Builds signed `.argus-plugin` artifacts |
| `argus-repo-index` | Official `index.json` + hosted artifacts | GitHub Pages / Releases / static host |

Consequences for sequencing:

- **`argus-plugin-sdk` is created first** (Phase 1) and published (or consumed via a git/npm dependency) so the host and plugins depend on a real, versioned contract.
- The **stub plugin lives in `argus-plugins`**, not in the host repo.
- The host depends on the SDK as a normal external dependency (npm registry, or git URL / `npm link` during early local iteration).
- Each repo has its own CI and SemVer versioning.

## Consequences

**Positive**

- No later extraction/migration; the target topology exists immediately.
- The plugin contract is a real published boundary from Phase 1 — discourages the host from reaching into plugin internals.
- Contributors can find the SDK, plugins, and index as first-class repos right away.

**Negative / mitigations**

- More upfront setup: four repos, four CI pipelines, and cross-repo version coordination. *Mitigation:* keep each repo minimal at first; automate releases.
- Contract changes span repos (SDK bump → host + plugins update). *Mitigation:* SemVer + `apiVersion` in the manifest; use `npm link` / git deps for fast local iteration before publishing.
- Slower first end-to-end loop than a monorepo. *Accepted* in exchange for a clean boundary.

**Does not change**

- The plugin contract itself ([ADR 0001](0001-plugin-contract-ts-interfaces.md)) — TS interfaces, in-process runtime, hot-download — is unaffected; only *where code lives* is decided here.
