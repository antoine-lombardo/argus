# Plugin contract — TypeScript interfaces & in-process runtime

Date: 2026-07-14  
Status: Accepted

## Context

Argus needs a stable boundary between the host app and provider plugins. Plugins must be installable from repositories, updatable without an app-store release where policy allows, and implementable by a solo developer without heavy native tooling.

During planning we evaluated:

- **Runtime:** in-process JS vs isolated worker/WebView vs native modules vs remote plugins
- **API style:** TypeScript interfaces vs JSON-RPC vs local HTTP

The team is small; iteration speed and a clear typed contract matter more than maximum isolation in v1.

## Decision

1. **Plugin runtime:** JavaScript / TypeScript bundles loaded **in-process** in the host. The kernel calls plugin methods directly.
2. **Plugin API:** **TypeScript interfaces** — plugins export a default object implementing `ArgusPlugin`; the host holds a typed reference and invokes methods (`search`, `getDetails`, `getPlayback`, etc.).
3. **Packaging:** single pre-bundled `index.js` inside a `.argus-plugin` zip with `manifest.json` (JS-only in v1; no native code in plugins).
4. **Updates:** plugins are **hot-downloaded** from repo indexes; JS-only plugin changes do not require a host app-store release (subject to store-policy validation in a later spike).
5. **Isolation compensations (v1):** per-call timeouts, `AbortSignal`, error boundaries, and a per-plugin circuit breaker — not a separate process.

Contract types live in `@argus/plugin-sdk` (see [0002-multi-repo-layout.md](0002-multi-repo-layout.md)).

## Consequences

**Positive**

- Fastest path for a solo/small team: one language, shared types, straightforward debugging.
- Plugins are easy to author and test with fixtures.
- Hot updates keep provider logic out of the host release cycle.

**Negative / risks**

- Weak crash isolation — a thrown error or runaway loop can affect the host; mitigated by kernel wrappers, not eliminated.
- TypeScript interfaces couple plugins to the SDK's type definitions; breaking changes require `apiVersion` bumps and host compatibility checks.
- In-process + hot-download may conflict with App Store / Play policies — requires a dedicated spike before relying on OTA plugin delivery.

**Follow-up**

- Implement contract types and fixture tests in Phase 1.
- Spike store policy and runtime isolation if in-process proves insufficient ([ARCHITECTURE.md](../ARCHITECTURE.md#open-questions--adr-backlog)).
