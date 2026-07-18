# Per-plugin secure storage via expo-secure-store

Date: 2026-07-18  
Status: Accepted

## Context

Plugins need a namespaced place for secrets (tokens, device codes). The host must isolate namespaces per plugin id and gate access behind the `secureStorage` permission.

## Decision

1. Back `HostContext.secureStore` with **`expo-secure-store`** (Keychain / Keystore).
2. Physical keys are `argus.p.<sanitizedPluginId>.<sanitizedKey>` (hashed suffix if over length limits).
3. Calls without the `secureStorage` permission throw `ArgusError("PLUGIN_ERROR")`.
4. Plugins never import `expo-secure-store` themselves — only via `HostContext`.

## Consequences

- Requires the `expo-secure-store` config plugin and a native rebuild after first add.
- Platform key length/charset limits are handled by sanitization + hash fallback.
- Not a substitute for sandboxing: in-process plugins could still attempt other storage APIs; permission enforcement is on the host service only (see PLUGIN-AUTHORING known limits).
