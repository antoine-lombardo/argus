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
 * EZDRM public FairPlay demo (Shaka Player test asset).
 * Different vendor/packaging than Axinom CMAF — used to isolate stream vs player issues.
 * Playlist key URI is `skd://fps.ezdrm.com/;{uuid}`; expo-video needs `contentId` = uuid
 * (not the full host/;uuid string). Physical Apple TV only.
 * @see https://github.com/shaka-project/shaka-player (demo EZDRM FairPlay asset)
 */
export const FAIRPLAY_HLS: StreamDescriptor = {
  url: 'https://na-fps.ezdrm.com/demo/ezdrm/master.m3u8',
  type: 'hls',
  drm: {
    scheme: 'fairplay',
    licenseUrl:
      'https://fps.ezdrm.com/api/licenses/b99ed9e5-c641-49d1-bfa8-43692b686ddb',
    certificateUrl: 'https://fps.ezdrm.com/demo/video/eleisure.cer',
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
