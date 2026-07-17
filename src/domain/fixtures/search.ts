import type { MediaItem } from '@argus-tv/plugin-sdk';

import { fixtureMedia } from './home-rows';

/** Flat catalog for fixture search (unique items from home fixtures). */
export const searchCatalog: MediaItem[] = Object.values(fixtureMedia);

/**
 * Case-insensitive title / tagline / type match. Empty query → no results
 * (prompt the user to type).
 */
export function searchFixtures(query: string): MediaItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return searchCatalog.filter((item) => {
    const haystack = [item.title, item.tagline, item.type, item.year?.toString()]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}
