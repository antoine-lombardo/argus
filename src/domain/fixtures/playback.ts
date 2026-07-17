import type { MediaId, StreamDescriptor } from '@argus-tv/plugin-sdk';

import { getFixtureDetails } from '@/domain/fixtures/details';
import { mediaIdKey } from '@/domain/media-id';

/**
 * Clear HLS sample for Phase 2c (no DRM).
 * Apple bipbop advanced example — works on tvOS AVPlayer.
 */
export const CLEAR_HLS_URL =
  'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8';

/**
 * Google / ExoPlayer public Widevine DASH (Tears of Steel) + UAT license proxy.
 * No entitlement token. Spike target for Android TV (Phase 2b).
 * @see https://github.com/google/ExoPlayer demos media.exolist.json
 */
export const WIDEVINE_DASH: StreamDescriptor = {
  url: 'https://storage.googleapis.com/wvmedia/cenc/h264/tears/tears.mpd',
  type: 'dash',
  drm: {
    scheme: 'widevine',
    licenseUrl:
      'https://proxy.uat.widevine.com/proxy?video_id=2015_tears&provider=widevine_test',
  },
};

/**
 * Axinom public FairPlay CMAF (cbcs) test vector + evaluation FPS certificate.
 * License auth: `X-AxDRM-Message` + `Content-Type: application/octet-stream` (header-only).
 * Asset id from playlist is `skd://{keyId}:{iv}` — expo-video strips `skd://` and uses the rest.
 * Physical Apple TV only. Cert is embedded in `toVideoSource` for this certificateUrl.
 * @see https://github.com/Axinom/public-test-vectors
 */
const AXINOM_FPS_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJ2ZXJzaW9uIjogMSwKICAiY29tX2tleV9pZCI6ICI2OWU1NDA4OC1lOWUwLTQ1MzAtOGMxYS0xZWI2ZGNkMGQxNGUiLAogICJtZXNzYWdlIjogewogICAgInR5cGUiOiAiZW50aXRsZW1lbnRfbWVzc2FnZSIsCiAgICAidmVyc2lvbiI6IDIsCiAgICAibGljZW5zZSI6IHsKICAgICAgImFsbG93X3BlcnNpc3RlbmNlIjogdHJ1ZQogICAgfSwKICAgICJjb250ZW50X2tleXNfc291cmNlIjogewogICAgICAiaW5saW5lIjogWwogICAgICAgIHsKICAgICAgICAgICJpZCI6ICIzMDJmODBkZC00MTFlLTQ4ODYtYmNhNS1iYjFmODAxOGEwMjQiLAogICAgICAgICAgImVuY3J5cHRlZF9rZXkiOiAicm9LQWcwdDdKaTFpNDNmd3YremZ0UT09IiwKICAgICAgICAgICJ1c2FnZV9wb2xpY3kiOiAiUG9saWN5IEEiCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgImNvbnRlbnRfa2V5X3VzYWdlX3BvbGljaWVzIjogWwogICAgICAgIHsKICAgICAgICAgIm5hbWUiOiAiUG9saWN5IEEiLAogICAgICAgICJwbGF5cmVhZHkiOiB7CiAgICAgICAgICAibWluX2RldmljZV9zZWN1cml0eV9sZXZlbCI6IDE1MCwKICAgICAgICAgICJwbGF5X2VuYWJsZXJzIjogWwogICAgICAgICAgICAiNzg2NjI3RDgtQzJBNi00NEJFLThGODgtMDhBRTI1NUIwMUE3IgogICAgICAgICAgXQogICAgICAgIH0KICAgICAgfQogICAgXQogIH0KfQ._NfhLVY7S6k8TJDWPeMPhUawhympnrk6WAZHOVjER6M';

export const FAIRPLAY_HLS: StreamDescriptor = {
  url: 'https://media.axprod.net/TestVectors/Cmaf/protected_1080p_h264_cbcs/manifest.m3u8',
  type: 'hls',
  drm: {
    scheme: 'fairplay',
    licenseUrl: 'https://drm-fairplay-licensing.axprod.net/AcquireLicense',
    certificateUrl: 'https://tools.axinom.com/FPScert/fairplay.cer',
    headers: {
      'X-AxDRM-Message': AXINOM_FPS_TOKEN,
      'Content-Type': 'application/octet-stream',
    },
  },
};

/**
 * Stand-in for `ArgusPlugin.getPlayback()`.
 * Most fixtures → clear HLS; DRM spike cards use Widevine / FairPlay descriptors.
 */
export function getFixturePlayback(id: MediaId): StreamDescriptor | undefined {
  const details = getFixtureDetails(id);
  const known =
    details != null || id.pluginId === 'argus.fixture';

  if (!known) return undefined;

  if (id.providerId === 'drm-widevine') {
    return WIDEVINE_DASH;
  }
  if (id.providerId === 'drm-fairplay') {
    return FAIRPLAY_HLS;
  }

  return {
    url: CLEAR_HLS_URL,
    type: 'hls',
    live: id.type === 'liveEvent',
  };
}

/** Debug helper — which fixture key a stream was resolved for. */
export function playbackLabel(id: MediaId): string {
  return getFixtureDetails(id)?.title ?? mediaIdKey(id);
}
