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
 * Stand-in for `ArgusPlugin.getPlayback()` — every known fixture resolves
 * to the same clear HLS stream until real plugins land.
 */
export function getFixturePlayback(id: MediaId): StreamDescriptor | undefined {
  const details = getFixtureDetails(id);
  // Episodes listed under series may not have their own MediaDetails entry.
  const known =
    details != null ||
    id.pluginId === 'argus.fixture';

  if (!known) return undefined;

  return {
    url: CLEAR_HLS_URL,
    type: 'hls',
    live: id.type === 'liveEvent',
    // Title hint for future now-playing / chrome (not part of StreamDescriptor).
  };
}

/** Debug helper — which fixture key a stream was resolved for. */
export function playbackLabel(id: MediaId): string {
  return getFixtureDetails(id)?.title ?? mediaIdKey(id);
}
