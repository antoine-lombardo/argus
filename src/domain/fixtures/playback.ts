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
 * Axinom public FairPlay HLS test vector + evaluation FPS certificate.
 * Token goes on the license request as `X-AxDRM-Message` (or AxDrmMessage query).
 * Physical Apple TV only.
 * @see https://github.com/Axinom/public-test-vectors
 */
const AXINOM_FPS_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJ2ZXJzaW9uIjogMSwKICAiY29tX2tleV9pZCI6ICI2OWU1NDA4OC1lOWUwLTQ1MzAtOGMxYS0xZWI2ZGNkMGQxNGUiLAogICJtZXNzYWdlIjogewogICAgInR5cGUiOiAiZW50aXRsZW1lbnRfbWVzc2FnZSIsCiAgICAidmVyc2lvbiI6IDIsCiAgICAibGljZW5zZSI6IHsKICAgICAgImFsbG93X3BlcnNpc3RlbmNlIjogdHJ1ZQogICAgfSwKICAgICJjb250ZW50X2tleXNfc291cmNlIjogewogICAgICAiaW5saW5lIjogWwogICAgICAgIHsKICAgICAgICAgICJpZCI6ICI0MDYwYTg2NS04ODc4LTQyNjctOWNiZi05MWFlNWJhZTFlNzIiLAogICAgICAgICAgImVuY3J5cHRlZF9rZXkiOiAid3QzRW51dVI1UkFybjZBRGYxNkNCQT09IiwKICAgICAgICAgICJ1c2FnZV9wb2xpY3kiOiAiUG9saWN5IEEiCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgImNvbnRlbnRfa2V5X3VzYWdlX3BvbGljaWVzIjogWwogICAgICB7CiAgICAgICAgIm5hbWUiOiAiUG9saWN5IEEiLAogICAgICAgICJwbGF5cmVhZHkiOiB7CiAgICAgICAgICAibWluX2RldmljZV9zZWN1cml0eV9sZXZlbCI6IDE1MCwKICAgICAgICAgICJwbGF5X2VuYWJsZXJzIjogWwogICAgICAgICAgICAiNzg2NjI3RDgtQzJBNi00NEJFLThGODgtMDhBRTI1NUIwMUE3IgogICAgICAgICAgXQogICAgICAgIH0KICAgICAgfQogICAgXQogIH0KfQ.l8PnZznspJ6lnNmfAE9UQV532Ypzt1JXQkvrk8gFSRw';

export const FAIRPLAY_HLS: StreamDescriptor = {
  url: 'https://media.axprod.net/TestVectors/Hls/protected_hls_1080p_h264_singlekey/manifest.m3u8',
  type: 'hls',
  drm: {
    scheme: 'fairplay',
    // Token also as query (`AxDrmMessage`) — some stacks drop custom DRM headers.
    licenseUrl: `https://drm-fairplay-licensing.axprod.net/AcquireLicense?AxDrmMessage=${AXINOM_FPS_TOKEN}`,
    certificateUrl: 'https://tools.axinom.com/FPScert/fairplay.cer',
    headers: {
      'X-AxDRM-Message': AXINOM_FPS_TOKEN,
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
