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
4. **DRM spike (2b)** required on physical devices at decision time; **completed 2026-07-17** (FairPlay + Widevine). This ADR still locks the player library for TV.

## Consequences

**Positive**

- Official tvOS support; no Nitro / RNV tvOS podspec patches.
- Custom chrome and clear HLS path for Phase 2c.
- Documented iOS hook for playlist/URL preprocessing when plugins need segment rewrite.
- Device spike succeeded without a custom native DRM module.

**Negative / risks**

- FairPlay `getLicense`-style and Android ExoPlayer factory depth are thinner than RNV v7 — revisit only if a real provider needs custom license shaping beyond headers/`contentId`.
- Advanced iOS transport (`VideoAssetTransportProvider`) is native Swift; Android rewrite still needs an ExoPlayer / proxy path.
- Adding or upgrading `expo-video` requires a **native rebuild** (`npm run prebuild:tv` then `npm run ios` / EAS).
- Some public FairPlay vectors (e.g. Axinom) fail with opaque `DRMLoadException`; fixture choice matters (`contentId` for EZDRM `skd://host/;uuid`).

**Follow-up**

- ~~Phase 2c: clear HLS Player screen consuming fixture `StreamDescriptor`.~~
- ~~Phase 2b DRM spike:~~ host maps `StreamDescriptor.drm` → expo-video `VideoSource.drm` via `toVideoSource` (`licenseUrl` → `licenseServer`). Verified fixtures:
  - **Widevine (Android TV, 2026-07-17):** Google Tears of Steel DASH + Widevine UAT proxy (`video_id=2015_tears`).
  - **FairPlay (physical ATV, 2026-07-17):** EZDRM public HLS (`na-fps.ezdrm.com` Big Buck Bunny) + `eleisure.cer` + license UUID; `contentId` = asset UUID. Gated to Apple device (`expo-device` `isDevice`).
- Later: host HLS proxy / transport API for plugin playlist rewrite.
