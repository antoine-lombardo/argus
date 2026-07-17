# Player shell — expo-video

Date: 2026-07-17  
Status: Accepted  
Supersedes: [ADR 0005](0005-player-react-native-video.md)

## Context

Argus needs an in-app player that:

- Plays clear HLS on **tvOS** / Android TV (Phase 2c), then FairPlay + Widevine (Phase 2b)
- Lets the host own Netflix-style TV chrome (`nativeControls` off + RN overlay)
- Fits Expo SDK 57 + `react-native-tvos` via prebuild / dev client
- Maps cleanly to plugin `StreamDescriptor` (`url`, `type`, `drm`, `headers`, …)
- Leaves room for plugins to **rewrite HLS playlists / segment URLs** before playback (host transport: local proxy and/or `AVAssetResourceLoaderDelegate` via expo-video’s `VideoAssetTransportProvider`)

Options compared:

1. **`expo-video`** — official Expo module, **tvOS-documented**, FairPlay/Widevine config on `VideoSource`, custom UI via `nativeControls={false}`, iOS transport extension for resource-loader / proxy.
2. **`react-native-video` v7** — deeper DRM/`overrideSource` hooks, but **TV Support TODO**; podspecs omit `:tvos` (see [ADR 0005](0005-player-react-native-video.md)).
3. **Bitmovin** — strong TV DRM; paid; weaker free custom-chrome path.
4. **Custom native module** — maximum control; deferred unless expo-video fails DRM or rewrite spikes.

## Decision

1. **Player library:** **`expo-video`** (SDK 57 line) with the official Expo config plugin in `app.json`.
2. **UI:** host-owned chrome only — `nativeControls={false}` on `VideoView`.
3. **HLS rewrite (plugins):** host-owned transport (local HLS proxy and/or `VideoAssetTransportProvider` + `AVAssetResourceLoaderDelegate`), not baked into a third-party player plugin. `StreamDescriptor.url` remains what the player plays (often a proxy URL).
4. **DRM spike (2b)** still required on physical devices; this ADR locks the player library for TV, not “DRM is done.”

## Consequences

**Positive**

- Official tvOS support; no Nitro / RNV tvOS podspec patches.
- Custom chrome and clear HLS path for Phase 2c.
- Documented iOS hook for playlist/URL preprocessing when plugins need segment rewrite.

**Negative / risks**

- FairPlay `getLicense`-style and Android ExoPlayer factory depth are thinner than RNV v7 — Phase 2b may need a small host native module or revisit if the spike fails.
- Advanced iOS transport (`VideoAssetTransportProvider`) is native Swift; Android rewrite still needs an ExoPlayer / proxy path.
- Adding or upgrading `expo-video` requires a **native rebuild** (`npm run prebuild:tv` then `npm run ios` / EAS).

**Follow-up**

- ~~Phase 2c: clear HLS Player screen consuming fixture `StreamDescriptor`.~~
- Later: host HLS proxy / transport API for plugin playlist rewrite.
- Phase 2b (in progress): host maps `StreamDescriptor.drm` → expo-video `VideoSource.drm` via `toVideoSource` (`licenseUrl` → `licenseServer`). Home **DRM spike** rail:
  - **Widevine:** Android only (not Apple). Google Tears of Steel DASH + Widevine UAT proxy (`video_id=2015_tears`) — verify on Android TV / emulator.
  - **FairPlay:** Apple **device** only — Simulator crashes if `AVContentKeySession` is created; we gate with `expo-device` `isDevice` and never mount the player when blocked (also avoids clear-HLS audio leak from a placeholder source). Fixture: Axinom HLS test vector + `tools.axinom.com` FPS cert + `X-AxDRM-Message` — verify on physical ATV.
