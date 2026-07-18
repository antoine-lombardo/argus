import { describe, expect, it } from 'vitest';

import { createKeyValueStore } from '@/platform/host/cache';

describe('key value cache', () => {
  it('evicts oldest when over max entries', async () => {
    const cache = createKeyValueStore('p', 2);
    await cache.set('a', 1);
    await cache.set('b', 2);
    await cache.set('c', 3);
    expect(await cache.get('a')).toBeNull();
    expect(await cache.get('b')).toBe(2);
    expect(await cache.get('c')).toBe(3);
  });

  it('honors ttl', async () => {
    const cache = createKeyValueStore('p', 10);
    await cache.set('x', 'y', 1);
    await new Promise((r) => setTimeout(r, 5));
    expect(await cache.get('x')).toBeNull();
  });
});
