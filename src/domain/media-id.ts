import type { MediaId, MediaType } from '@argus-tv/plugin-sdk';

const MEDIA_TYPES: MediaType[] = [
  'movie',
  'series',
  'season',
  'episode',
  'liveEvent',
  'channel',
];

/** Stable string form of a `MediaId` (route params / store keys). */
export function mediaIdKey(id: MediaId): string {
  return `${id.pluginId}/${id.type}/${id.providerId}`;
}

/** Parse `mediaIdKey` output back into a `MediaId`. */
export function parseMediaIdKey(key: string): MediaId | null {
  const parts = key.split('/');
  if (parts.length !== 3) return null;
  const [pluginId, type, providerId] = parts;
  if (!pluginId || !providerId || !MEDIA_TYPES.includes(type as MediaType)) {
    return null;
  }
  return { pluginId, type: type as MediaType, providerId };
}
