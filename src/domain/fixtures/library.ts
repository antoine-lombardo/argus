import type { MediaItem } from '@argus-tv/plugin-sdk';

import { fixtureMedia } from '@/domain/fixtures/home-rows';
import { mediaIdKey } from '@/domain/media-id';

/** Continue-watching strip for Phase 2c Library (local store seed). */
export const libraryContinueWatching: MediaItem[] = [
  fixtureMedia.voltage,
  fixtureMedia.quartz,
  fixtureMedia.harbor,
];

/** Favorites strip for Phase 2c Library (local store seed). */
export const libraryFavorites: MediaItem[] = [
  fixtureMedia.nebula,
  fixtureMedia.summit,
  fixtureMedia.relay,
  fixtureMedia.orchard,
];

const byKey = new Map<string, MediaItem>(
  Object.values(fixtureMedia).map((item) => [mediaIdKey(item.id), item]),
);

/** Resolve a store key back to a fixture `MediaItem`. */
export function resolveFixtureMedia(key: string): MediaItem | undefined {
  return byKey.get(key);
}
