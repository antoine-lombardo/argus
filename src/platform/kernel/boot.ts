/**
 * Boot plugins.
 *
 * Load mode (`EXPO_PUBLIC_ARGUS_PLUGIN_LOAD`, default `auto`):
 * - `auto`: `__DEV__` → Metro HMR example when present; else store/seed
 * - `hmr`: prefer Metro HMR (falls back to store)
 * - `store`: always plugin store / seed (use this to test prod-like loading in dev)
 *
 * See `src/platform/plugins/load-mode.ts`.
 */
import type { ArgusPlugin } from '@argus-tv/plugin-sdk';

import { pluginKernel } from '@/platform/kernel';
import { getPluginLoadMode, shouldTryDevHmr } from '@/platform/plugins/load-mode';
import {
  ensureSeedPluginInstalled,
  listInstalled,
  loadPluginFromDirectory,
  pluginDirPath,
} from '@/platform/plugins/store';

let bootPromise: Promise<void> | null = null;

function resolveDefault(mod: unknown): ArgusPlugin {
  const m = mod as ArgusPlugin | { default: ArgusPlugin };
  if (m && typeof m === 'object' && 'default' in m && m.default) {
    return m.default;
  }
  return m as ArgusPlugin;
}

async function bootDevExample(): Promise<boolean> {
  if (!shouldTryDevHmr()) return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@argus-dev/plugin-example');
    const plugin = resolveDefault(mod);
    if (!plugin?.manifest) return false;
    await pluginKernel.replaceOrRegister(plugin);
    console.info(
      `[boot] plugin load=hmr (${getPluginLoadMode()}) id=${plugin.manifest.id}`,
    );
    return true;
  } catch (err) {
    console.info(
      '[boot] Dev example unavailable — using plugin store / seed. Clone argus-plugins beside argus for HMR.',
      err instanceof Error ? err.message : err,
    );
    return false;
  }
}

async function bootFromStore(): Promise<void> {
  await ensureSeedPluginInstalled();
  const installed = await listInstalled();
  console.info(
    `[boot] plugin load=store (${getPluginLoadMode()}) installed=${installed.length}`,
  );
  for (const record of installed) {
    if (!record.enabled) continue;
    if (pluginKernel.getState(record.id)) continue;
    try {
      const { plugin } = await loadPluginFromDirectory(pluginDirPath(record));
      await pluginKernel.registerPlugin(plugin);
    } catch (err) {
      console.error(`[boot] failed to load ${record.id}`, err);
    }
  }
}

async function runBoot(): Promise<void> {
  const usedDev = await bootDevExample();
  if (!usedDev) {
    await bootFromStore();
  }
}

export function bootPlugins(): Promise<void> {
  // When HMR may re-register, do not cache the boot promise forever.
  if (shouldTryDevHmr()) {
    return runBoot().catch((err) => {
      console.error('[boot] plugin registration failed', err);
      throw err;
    });
  }
  if (!bootPromise) {
    bootPromise = runBoot().catch((err) => {
      console.error('[boot] plugin registration failed', err);
      bootPromise = null;
      throw err;
    });
  }
  return bootPromise;
}
