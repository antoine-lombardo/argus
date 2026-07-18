# Agent guide — Argus

Instructions for AI agents and contributors working in this repository.

## What Argus is

Argus is a **React Native** streaming hub: one UI over many providers (Netflix, Prime Video, NHL, etc.) via **plugins**. It must support **movies, series, and live events**. Plugins are discovered from **public and private repositories** (Kodi-like model).

The **host TV app** lives in this repo (Expo SDK 57, `react-native-tvos`, Expo Router). Product and process docs live under `docs/`.

## Keep the living docs updated — always, unprompted

This is a standing requirement. The user must **never** have to ask you to update docs. Whenever your change affects them, update these in the **same** change:

| Doc                                                        | Update when…                                                                                                                                                                                                           |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [docs/IMPLEMENTATION-PLAN.md](docs/IMPLEMENTATION-PLAN.md) | You start/finish a task, hit a blocker, or make a decision. Check off tasks, refresh the **status snapshot** (phase / last updated / next milestone / blockers), append to the **decision log** and **risk register**. |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)               | A design detail changes, or a `(default)` becomes decided (also add/link an ADR in `docs/adr/`).                                                                                                                       |
| [docs/PACKAGING.md](docs/PACKAGING.md)                     | Anything about builds, distribution, or CI changes.                                                                                                                                                                    |
| [README.md](README.md) / this file                         | Docs are added, moved, or norms change—keep the docs table and links current.                                                                                                                                          |

If code and docs disagree, that is a bug: fix the docs as part of the same work. Set "Last updated" to the current date when you touch the plan.

## Multi-repo layout

Argus spans separate repos ([ADR 0002](docs/adr/0002-multi-repo-layout.md)):

| Repo                | Purpose                                                         |
| ------------------- | --------------------------------------------------------------- |
| `argus` (this repo) | Host TV app + product/process docs                              |
| `argus-plugin-sdk`  | The plugin contract (`@argus-tv/plugin-sdk`). Local: `file:` sibling; published to npm for third parties. |
| `argus-plugins`     | Official + reference plugins                                    |
| `argus-repo-index`  | Official repo index + artifacts                                 |

Each code repo carries its own `AGENTS.md`; read the one for the repo you're in.

## Releasing the SDK (`@argus-tv/plugin-sdk`)

Publishing is **automated** — never hand-edit the version, run `npm publish`, or
tag manually. To release: add a **changeset** (`npm run changeset`) with your
change, push to `main`, then **merge the auto-generated "Version Packages" PR**;
that publishes to npm (provenance, `next` dist-tag for `0.x`). Full runbook:
`argus-plugin-sdk/AGENTS.md`; process reference: [docs/PACKAGING.md](docs/PACKAGING.md#sdk-npm-package-argus-tvplugin-sdk).

## Before writing code

1. Read [README.md](README.md), [docs/VISION.md](docs/VISION.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/IMPLEMENTATION-PLAN.md](docs/IMPLEMENTATION-PLAN.md), [docs/PACKAGING.md](docs/PACKAGING.md), [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md), [docs/PLUGIN-SYSTEM.md](docs/PLUGIN-SYSTEM.md), and [docs/PLUGIN-AUTHORING.md](docs/PLUGIN-AUTHORING.md).
2. Treat items marked **(default)** or listed under open questions as **provisional**. Do not lock a plugin runtime, sandbox, or DRM approach without an ADR.
3. Prefer design notes, ADRs, or RFCs in `docs/` before scaffolding packages or dependencies.
4. When implementing, work through [docs/IMPLEMENTATION-PLAN.md](docs/IMPLEMENTATION-PLAN.md) and **keep it updated** (check off tasks, add notes, link ADRs/PRs).
5. Plugin authors: start from `argus-plugins/packages/example` and follow [PLUGIN-AUTHORING.md](docs/PLUGIN-AUTHORING.md).

## Scope rules

- **Docs-first until explicitly asked** to scaffold the RN app or plugin packages.
- **No provider implementations** that scrape, reverse engineer, or embed third-party credentials.
- **Keep the core provider-agnostic**—provider-specific behavior belongs in plugins (conceptually, even before the API exists).
- **Do not add** drive-by refactors, new tooling, or markdown the user did not ask for.

## When implementing (later)

Follow the phasing in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md):

1. Plugin contract and media model
2. Host app shell (React Native)
3. Reference / stub plugin
4. Repo install & update flow
5. Real providers (legal / available APIs only)

Match existing project style once code exists. Prefer small, reviewable changes.

## Where to put new documentation

| Kind                      | Location                         |
| ------------------------- | -------------------------------- |
| Product / process         | `docs/*.md`                      |
| Architecture decisions    | `docs/adr/` (create when needed) |
| Agent / contributor norms | `AGENTS.md`, `.cursor/rules/`    |

Link new docs from the README table when they are meant to be primary reading.
