import type { MediaItem, Row } from '@argus-tv/plugin-sdk';

import { mediaIdKey } from '@/domain/media-id';
import { pluginKernel } from '@/platform/kernel';
import { isArgusError, isExpectedArgusError } from '@/platform/sdk/errors';

export type AggregateSearchResult = {
  items: MediaItem[];
  errors: { pluginId: string; message: string; code?: string }[];
};

/**
 * Fan-out `search` to enabled plugins; merge as each settles; dedup by mediaIdKey.
 */
export async function aggregateSearch(
  query: string,
  onPartial?: (result: AggregateSearchResult) => void,
): Promise<AggregateSearchResult> {
  const ids = pluginKernel.enabledIds();
  const seen = new Set<string>();
  const items: MediaItem[] = [];
  const errors: AggregateSearchResult['errors'] = [];

  const emit = () => onPartial?.({ items: [...items], errors: [...errors] });

  await Promise.all(
    ids.map(async (pluginId) => {
      try {
        const found = await pluginKernel.search(pluginId, query, {});
        for (const item of found) {
          const key = mediaIdKey(item.id);
          if (seen.has(key)) continue;
          seen.add(key);
          items.push(item);
        }
        emit();
      } catch (err) {
        errors.push({
          pluginId,
          message: err instanceof Error ? err.message : String(err),
          code: isArgusError(err) ? err.code : undefined,
        });
        // Expected errors still surface in `errors` for UI, but don't poison the merge.
        if (!isExpectedArgusError(err) && !isArgusError(err)) {
          // already recorded
        }
        emit();
      }
    }),
  );

  return { items, errors };
}

export type AggregateHomeResult = {
  rows: Row[];
  errors: { pluginId: string; message: string }[];
};

/** Merge home rows from enabled catalog plugins (prefix row ids with pluginId). */
export async function aggregateHomeRows(): Promise<AggregateHomeResult> {
  const ids = pluginKernel.enabledIds();
  const rows: Row[] = [];
  const errors: AggregateHomeResult['errors'] = [];

  await Promise.all(
    ids.map(async (pluginId) => {
      try {
        const pluginRows = await pluginKernel.getHomeRows(pluginId);
        for (const row of pluginRows) {
          rows.push({
            ...row,
            id: `${pluginId}:${row.id}`,
          });
        }
      } catch (err) {
        errors.push({
          pluginId,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }),
  );

  return { rows, errors };
}
