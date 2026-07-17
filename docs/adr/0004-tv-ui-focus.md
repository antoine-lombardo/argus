# TV UI focus — native react-native-tvos primitives

Date: 2026-07-16  
Status: Accepted

## Context

Argus needs D-pad focus management for a Netflix-style sidebar/rail on **tvOS** and **Android TV** under Expo SDK 57 / `react-native-tvos@0.86`. Architecture called for building on an “existing RN TV component/focus library,” wrapped in a thin host focus service ([ARCHITECTURE.md](../ARCHITECTURE.md#platform-modules)).

Options considered:

1. **Native `react-native-tvos` focus** — `TVFocusGuideView`, Pressable `focused` / `onFocus`, `hasTVPreferredFocus`, `useTVEventHandler`
2. **`react-tv-space-navigation`** (BAM / Theodo) — declarative LRUD over a JS focus engine; used in some multi-TV samples
3. **Norigin Spatial Navigation** (React Native TV adapter) — hook-based API shared with web; newer RN TV support

v1 does **not** target web-based TV shells. The scaffold already uses native focus (`TVFocusGuideView`).

## Decision

1. **Focus engine:** native **`react-native-tvos`** focus primitives.
2. **Host surface:** thin wrappers under `src/platform/focus/` plus presentation components (`Focusable`, `FocusGuide`, rail/poster shells) under `src/presentation/components/tv/`.
3. **Rejected for v1:** `react-tv-space-navigation` and Norigin Spatial Navigation as the primary focus stack.

## Consequences

**Positive**

- Aligns with platform focus engines; no dual native+JS focus fights in Expo/dev overlays.
- Works with current stack (React 19 / Expo 57) without waiting on third-party React 19 maturity.
- Matches the authors’ own guidance: prefer native when web TV is not required.
- Scaffold code path stays continuous; wrappers formalize what we already use.

**Negative / risks**

- No single declarative spatial graph across platforms — we own rail/row focus wiring.
- Heavy virtualized multi-row grids may need extra care; revisit ADR if that becomes painful.
- If a web TV target appears later, a JS spatial-nav library may need a second look.

**Follow-up**

- Phase 2c: ~~sidebar/rail screens built on these wrappers~~ — `AppShell` uses dual `FocusGuide autoFocus` (sidebar + content) for Left/Right handoff; Up/Down on nav changes route on focus (2026-07-17). Remaining screens use the same wrappers.
- Revisit if web TV or large virtualized catalogs force a different focus model.
