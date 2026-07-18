import type { KeyValueStore } from '@argus-tv/plugin-sdk';

const DEFAULT_MAX_ENTRIES = 200;

type Entry = {
  value: unknown;
  expiresAt?: number;
};

/**
 * Per-plugin in-memory KV with TTL + max entry eviction (FIFO on overflow).
 */
export function createKeyValueStore(
  _pluginId: string,
  maxEntries = DEFAULT_MAX_ENTRIES,
): KeyValueStore {
  const map = new Map<string, Entry>();

  const purgeExpired = (key: string, entry: Entry): boolean => {
    if (entry.expiresAt != null && Date.now() >= entry.expiresAt) {
      map.delete(key);
      return true;
    }
    return false;
  };

  return {
    async get<T = unknown>(key: string): Promise<T | null> {
      const entry = map.get(key);
      if (!entry) return null;
      if (purgeExpired(key, entry)) return null;
      return entry.value as T;
    },

    async set<T = unknown>(key: string, value: T, ttlMs?: number): Promise<void> {
      if (map.has(key)) map.delete(key);
      while (map.size >= maxEntries) {
        const oldest = map.keys().next().value;
        if (oldest == null) break;
        map.delete(oldest);
      }
      map.set(key, {
        value,
        expiresAt: ttlMs != null ? Date.now() + ttlMs : undefined,
      });
    },

    async delete(key: string): Promise<void> {
      map.delete(key);
    },
  };
}
