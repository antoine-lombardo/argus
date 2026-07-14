# Agent guide — Argus

Instructions for AI agents and contributors working in this repository.

## What Argus is

Argus is a **React Native** streaming hub: one UI over many providers (Netflix, Prime Video, NHL, etc.) via **plugins**. It must support **movies, series, and live events**. Plugins are discovered from **public and private repositories** (Kodi-like model).

There is **no app code yet**—only product and process docs. Prefer updating docs over inventing implementation.

## Before writing code

1. Read [README.md](README.md), [docs/VISION.md](docs/VISION.md), [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md), and [docs/PLUGIN-SYSTEM.md](docs/PLUGIN-SYSTEM.md).
2. Treat open questions in those docs as **unresolved**. Do not hard-code a plugin runtime, sandbox, or DRM approach as if it were decided.
3. Prefer design notes, ADRs, or RFCs in `docs/` before scaffolding packages or dependencies.

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

| Kind | Location |
|------|----------|
| Product / process | `docs/*.md` |
| Architecture decisions | `docs/adr/` (create when needed) |
| Agent / contributor norms | `AGENTS.md`, `.cursor/rules/` |

Link new docs from the README table when they are meant to be primary reading.
