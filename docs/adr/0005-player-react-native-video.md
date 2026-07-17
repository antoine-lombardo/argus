# Player shell — react-native-video v7

Date: 2026-07-17  
Status: **Superseded** by [ADR 0006](0006-player-expo-video.md)

## Context

Argus briefly chose `react-native-video` v7 + `@react-native-video/drm` for custom UI and deep DRM/source hooks.

## Decision (historical)

Use RNV v7 + Nitro + DRM plugin with host-owned chrome.

## Why superseded

Upstream **TV Support is TODO** ([issue #4607](https://github.com/TheWidlarzGroup/react-native-video/issues/4607)): published podspecs declare `:ios` only, so Expo TV (`platform :tvos`) never linked the native modules. Playlist rewrite for plugins is also better owned by a host transport (local proxy / `AVAssetResourceLoaderDelegate`) than by the player package.

See [ADR 0006](0006-player-expo-video.md) for the current decision.
