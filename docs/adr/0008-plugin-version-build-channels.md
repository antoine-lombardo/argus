# Plugin versioning, build numbers, and dynamic repo channels

Date: 2026-07-18  
Status: Accepted

## Context

Plugins need automated publishing to the official GitHub Pages catalog
(`argus-repo-index`) without forcing a semver bump for every CI iteration, while
still having a clear path from experimental builds to an official release.
Repositories (official and third-party) must be able to expose different release
tracks without a fixed host enum of channels.

## Decision

1. **Identity:** every plugin release is `(version, build)` where `version` is
   semver and `build` is a positive integer monotonic within that version.
2. **Update check:** newer iff higher semver, or same semver with higher `build`.
3. **`index.json` is always the main channel.** Extra channels are listed in
   `channels[]` on that file and point at other catalog JSON files (e.g.
   `channels/experimental.json`). Channel ids/names are **repo-defined**.
4. **Official workflow:**
   - Bump semver on the `dev` branch to start a release line.
   - Every push to `dev` publishes a new build to the **experimental** channel.
   - Merge `dev` → `main` **promotes** the same `(version, build)` artifact into
     main (same URL / sha256; no rebuild).
5. **Host UX:**
   - Per-repo `selectedChannelId` (`main` or a listed channel id).
   - Show a channel picker only when `channels.length >= 1`.
   - When Metro HMR plugin load is active (`shouldTryDevHmr()`), channel
     selection is disabled (repo channel does not apply).

## Consequences

- `PluginManifest.build` is required in `@argus-tv/plugin-sdk` (breaking for
  `0.x` → minor bump).
- CI in `argus-plugins` needs write access to `argus-repo-index`
  (`REPO_INDEX_TOKEN`).
- Phase 4 install/fetch uses the selected channel’s index URL; Settings can
  already store the preference.
