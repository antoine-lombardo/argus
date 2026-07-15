# Architecture Decision Records

Use this folder when locking a design choice (plugin runtime, packaging, auth model, etc.).

Suggested filename: `NNNN-short-title.md` (e.g. `0001-plugin-runtime.md`).

Minimal template:

```markdown
# Title

Date: YYYY-MM-DD
Status: Proposed | Accepted | Superseded

## Context

## Decision

## Consequences
```

Link accepted ADRs from [../ARCHITECTURE.md](../ARCHITECTURE.md), [../PLUGIN-SYSTEM.md](../PLUGIN-SYSTEM.md), or [../DEVELOPMENT.md](../DEVELOPMENT.md) when relevant.

## Accepted

| ADR | Title |
|-----|-------|
| [0001](0001-plugin-contract-ts-interfaces.md) | Plugin contract — TypeScript interfaces & in-process runtime |
| [0002](0002-multi-repo-layout.md) | Multi-repo layout from the start |
| [0003](0003-app-versioning.md) | Host app versioning — Changesets for version, EAS for build number |
