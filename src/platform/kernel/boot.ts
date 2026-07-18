/**
 * Boot plugins.
 *
 * Load mode (`EXPO_PUBLIC_ARGUS_PLUGIN_LOAD`, default `auto`):
 * - `auto`: `__DEV__` → Metro HMR plugins when present; else plugin store / seed
 * - `hmr`: prefer Metro HMR (falls back to store)
 * - `store`: always plugin store / seed (use this to test prod-like loading in dev)
 *
 * HMR package list = official example + optional gitignored `dev-plugins.local.json`
 * (Metro writes `dev-hmr-registry.generated.js`).
 *
 * See `src/platform/plugins/load-mode.ts` and `docs/PLUGIN-AUTHORING.md`.
 */
import type { ArgusPlugin } from '@argus-tv/plugin-sdk';

import { useReposStore } from '@/application/stores/repos-store';
import { pluginKernel } from '@/platform/kernel';
import { getPluginLoadMode, shouldTryDevHmr } from '@/platform/plugins/load-mode';
import {
  ensureSeedPluginInstalled,
  listInstalled,
  loadPluginFromDirectory,
  pluginDirPath,
  resolvePluginRepoIndexUrl,
} from '@/platform/plugins/store';
import { syncPluginsWithRepos } from '@/platform/repos/plugin-gate';

let bootPromise: Promise<void> | null = null;

type HmrRegistry = {
  modules: Array<{ metroName: string; load: () => unknown }>;
};

function resolveDefault(mod: unknown): ArgusPlugin {
  const m = mod as ArgusPlugin | { default: ArgusPlugin };
  if (m && typeof m === 'object' && 'default' in m && m.default) {
    return m.default;
  }
  return m as ArgusPlugin;
}

function loadHmrRegistry(): HmrRegistry {
  try {
    // Generated when Metro starts (from gitignored dev-plugins.local.json).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('../plugins/dev-hmr-registry.generated.js') as HmrRegistry;
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('../plugins/dev-hmr-registry.fallback.js') as HmrRegistry;
  }
}

/**
 * Register every Metro HMR plugin (example + gitignored local extras).
 * Returns true if at least one registered (skip store boot in that case).
 */
async function bootDevHmrPlugins(): Promise<boolean> {
  if (!shouldTryDevHmr()) return false;

  const registry = loadHmrRegistry();
  let registered = 0;

  for (const entry of registry.modules) {
    try {
      const plugin = resolveDefault(entry.load());
      if (!plugin?.manifest) continue;
      // Local HMR plugins are not gated by remote repos.
      await pluginKernel.replaceOrRegister(plugin, { repoIndexUrl: null });
      registered += 1;
      console.info(
        `[boot] plugin load=hmr (${getPluginLoadMode()}) id=${plugin.manifest.id} via ${entry.metroName}`,
      );
    } catch (err) {
      console.info(
        `[boot] HMR plugin unavailable (${entry.metroName})`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  if (registered === 0) {
    console.info(
      '[boot] No HMR plugins — add dev-plugins.local.json (see .example) or use plugin store mode.',
    );
    return false;
  }
  return true;
}

async function bootFromStore(): Promise<void> {
  await ensureSeedPluginInstalled();
  const installed = await listInstalled();
  console.info(
    `[boot] plugin load=store (${getPluginLoadMode()}) installed=${installed.length}`,
  );
  for (const record of installed) {
    const repoIndexUrl = resolvePluginRepoIndexUrl(record);
    if (pluginKernel.getState(record.id)) {
      // Already registered (e.g. HMR) — sync enable flag from store.
      if (record.enabled) await pluginKernel.enable(record.id);
      else await pluginKernel.disable(record.id, 'Disabled in settings');
      continue;
    }
    try {
      const { plugin } = await loadPluginFromDirectory(pluginDirPath(record));
      await pluginKernel.registerPlugin(plugin, { repoIndexUrl });
      // registerPlugin enables; honor persisted disable.
      if (!record.enabled) {
        await pluginKernel.disable(record.id, 'Disabled in settings');
      }
    } catch (err) {
      console.error(`[boot] failed to load ${record.id}`, err);
    }
  }
}

async function runBoot(): Promise<void> {
  const usedDev = await bootDevHmrPlugins();
  if (!usedDev) {
    await bootFromStore();
  }
  await useReposStore.getState().hydrate();
  await syncPluginsWithRepos(useReposStore.getState().repos);
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
