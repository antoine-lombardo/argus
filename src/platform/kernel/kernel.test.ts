import { describe, expect, it, vi } from 'vitest';

import type { ArgusPlugin, PluginManifest } from '@argus-tv/plugin-sdk';
import { ArgusError, API_VERSION } from '@argus-tv/plugin-sdk';

import { createPluginKernelForTests } from '@/platform/kernel';

function baseManifest(over: Partial<PluginManifest> = {}): PluginManifest {
  return {
    id: 'argus.test',
    name: 'Test',
    version: '0.0.1',
    build: 1,
    apiVersion: API_VERSION,
    entry: 'index.js',
    capabilities: ['search', 'catalog', 'vod'],
    permissions: ['network'],
    platforms: ['tvos', 'androidtv'],
    ...over,
  };
}

function makePlugin(over: Partial<ArgusPlugin> = {}): ArgusPlugin {
  return {
    manifest: baseManifest(),
    async initialize() {},
    async search() {
      return [];
    },
    async getHomeRows() {
      return [];
    },
    async getDetails() {
      throw new ArgusError('NOT_AVAILABLE');
    },
    async getPlayback() {
      throw new ArgusError('NOT_AVAILABLE');
    },
    ...over,
  };
}

describe('plugin kernel', () => {
  it('registers and searches an enabled plugin', async () => {
    const kernel = createPluginKernelForTests();
    await kernel.registerPlugin(
      makePlugin({
        async search() {
          return [
            {
              id: { pluginId: 'argus.test', type: 'movie', providerId: 'a' },
              type: 'movie',
              title: 'Alpha',
              artwork: {},
              badges: [],
            },
          ];
        },
      }),
    );
    const items = await kernel.search('argus.test', 'a');
    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe('Alpha');
  });

  it('duck-types foreign ArgusError and does not trip breaker on AUTH_REQUIRED', async () => {
    const kernel = createPluginKernelForTests();
    let calls = 0;
    await kernel.registerPlugin(
      makePlugin({
        async search() {
          calls += 1;
          const foreign = Object.assign(new Error('need login'), {
            name: 'ArgusError',
            code: 'AUTH_REQUIRED',
          });
          throw foreign;
        },
      }),
    );

    for (let i = 0; i < 5; i++) {
      await expect(kernel.search('argus.test', 'x')).rejects.toMatchObject({
        code: 'AUTH_REQUIRED',
      });
    }
    expect(kernel.getState('argus.test')?.enabled).toBe(true);
    expect(calls).toBe(5);
  });

  it('trips circuit breaker on repeated PLUGIN_ERROR', async () => {
    const kernel = createPluginKernelForTests();
    await kernel.registerPlugin(
      makePlugin({
        async search() {
          throw new ArgusError('PLUGIN_ERROR', 'boom');
        },
      }),
    );

    for (let i = 0; i < 3; i++) {
      await expect(kernel.search('argus.test', 'x')).rejects.toMatchObject({
        code: 'PLUGIN_ERROR',
      });
    }
    expect(kernel.getState('argus.test')?.enabled).toBe(false);
    expect(kernel.getState('argus.test')?.disabledReason).toMatch(/failures/);
  });

  it('drops items with foreign pluginId', async () => {
    const kernel = createPluginKernelForTests();
    await kernel.registerPlugin(
      makePlugin({
        async search() {
          return [
            {
              id: { pluginId: 'other.plugin', type: 'movie', providerId: 'x' },
              type: 'movie',
              title: 'Spoof',
              artwork: {},
              badges: [],
            },
            {
              id: { pluginId: 'argus.test', type: 'movie', providerId: 'y' },
              type: 'movie',
              title: 'Ok',
              artwork: {},
              badges: [],
            },
          ];
        },
      }),
    );
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const items = await kernel.search('argus.test', 'q');
    spy.mockRestore();
    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe('Ok');
  });

  it('refuses incompatible apiVersion', async () => {
    const kernel = createPluginKernelForTests();
    await expect(
      kernel.registerPlugin(
        makePlugin({
          manifest: baseManifest({ apiVersion: '9.9' }),
        }),
      ),
    ).rejects.toMatchObject({ code: 'PLUGIN_ERROR' });
  });
});
