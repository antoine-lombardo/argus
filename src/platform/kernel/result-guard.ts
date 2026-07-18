import type { MediaItem, Row } from '@argus-tv/plugin-sdk';

const MEDIA_TYPES = new Set([
  'movie',
  'series',
  'season',
  'episode',
  'liveEvent',
  'channel',
]);

/**
 * Drop malformed items and items whose `pluginId` does not match the caller.
 */
export function guardMediaItems(pluginId: string, items: unknown): MediaItem[] {
  if (!Array.isArray(items)) return [];
  const out: MediaItem[] = [];
  for (const raw of items) {
    const item = asMediaItem(pluginId, raw);
    if (item) out.push(item);
  }
  return out;
}

export function guardRows(pluginId: string, rows: unknown): Row[] {
  if (!Array.isArray(rows)) return [];
  const out: Row[] = [];
  for (const raw of rows) {
    if (typeof raw !== 'object' || raw === null) continue;
    const r = raw as Record<string, unknown>;
    if (typeof r.id !== 'string' || typeof r.title !== 'string') continue;
    out.push({
      id: r.id,
      title: r.title,
      items: guardMediaItems(pluginId, r.items),
    });
  }
  return out;
}

function asMediaItem(pluginId: string, raw: unknown): MediaItem | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const item = raw as Record<string, unknown>;
  const id = item.id;
  if (typeof id !== 'object' || id === null) return null;
  const mid = id as Record<string, unknown>;
  if (
    typeof mid.pluginId !== 'string' ||
    typeof mid.type !== 'string' ||
    typeof mid.providerId !== 'string'
  ) {
    return null;
  }
  if (mid.pluginId !== pluginId) {
    console.warn(
      `[kernel] dropped item with foreign pluginId ${mid.pluginId} (expected ${pluginId})`,
    );
    return null;
  }
  if (!MEDIA_TYPES.has(mid.type)) return null;
  if (typeof item.title !== 'string' || typeof item.type !== 'string') return null;
  if (item.type !== mid.type) return null;

  return raw as MediaItem;
}
