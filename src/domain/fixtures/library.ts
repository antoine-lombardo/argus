import type { MediaItem } from '@argus-tv/plugin-sdk';

import { mediaId, mediaIdKey } from '@/domain/media-id';

const PLUGIN_ID = 'argus.example';

/** Lightweight seeds until library syncs from plugins (Phase 6). */
function seed(
  providerId: string,
  type: MediaItem['type'],
  title: string,
  posterSeed: string,
): MediaItem {
  return {
    id: mediaId(PLUGIN_ID, type, providerId),
    type,
    title,
    artwork: { poster: `https://picsum.photos/seed/argus-${posterSeed}/300/450` },
    badges: [{ pluginId: PLUGIN_ID, label: 'Example' }],
  };
}

export const libraryContinueWatching: MediaItem[] = [
  seed('voltage', 'episode', 'Voltage S1E3', 'voltage'),
  seed('quartz', 'series', 'Quartz City', 'quartz'),
  seed('harbor', 'movie', 'Harbor Lights', 'harbor'),
];

export const libraryFavorites: MediaItem[] = [
  seed('nebula', 'movie', 'Nebula Drift', 'nebula'),
  seed('summit', 'movie', 'Summit Protocol', 'summit'),
  seed('relay', 'liveEvent', 'Relay Cup — Finals', 'relay'),
  seed('orchard', 'series', 'The Orchard', 'orchard'),
];

const byKey = new Map<string, MediaItem>(
  [...libraryContinueWatching, ...libraryFavorites].map((item) => [
    mediaIdKey(item.id),
    item,
  ]),
);

export function resolveLibraryMedia(key: string): MediaItem | undefined {
  return byKey.get(key);
}

/** @deprecated use resolveLibraryMedia */
export const resolveFixtureMedia = resolveLibraryMedia;
