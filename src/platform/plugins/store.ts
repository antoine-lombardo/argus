import type { ArgusPlugin, PluginManifest } from '@argus-tv/plugin-sdk';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

import { assertManifest } from '@/platform/kernel/manifest';
import { evaluatePluginBundle } from '@/platform/plugins/load-cjs';
import { OFFICIAL_REPO_INDEX_URL } from '@/platform/repos/constants';

export { evaluatePluginBundle } from '@/platform/plugins/load-cjs';

const PLUGINS_DIR = `${FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? ''}plugins/`;
const REGISTRY_FILE = `${PLUGINS_DIR}registry.json`;

export type InstalledPluginRecord = {
  id: string;
  version: string;
  build: number;
  /** Directory under PLUGINS_DIR containing manifest.json + index.js */
  dirName: string;
  enabled: boolean;
  source: 'seed' | 'repo' | 'sideload' | 'dev';
  /** Origin repo index URL; seed → official. Sideload/dev may omit. */
  repoIndexUrl?: string;
};

type RegistryFile = {
  plugins: InstalledPluginRecord[];
  /** After the user uninstalls, never auto-copy the bundled seed again. */
  skipAutoSeed?: boolean;
};

async function ensureDir(path: string) {
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  }
}

async function readRegistry(): Promise<RegistryFile> {
  await ensureDir(PLUGINS_DIR);
  const info = await FileSystem.getInfoAsync(REGISTRY_FILE);
  if (!info.exists) return { plugins: [] };
  const raw = await FileSystem.readAsStringAsync(REGISTRY_FILE);
  return JSON.parse(raw) as RegistryFile;
}

async function writeRegistry(reg: RegistryFile) {
  await ensureDir(PLUGINS_DIR);
  await FileSystem.writeAsStringAsync(REGISTRY_FILE, JSON.stringify(reg, null, 2));
}

export async function listInstalled(): Promise<InstalledPluginRecord[]> {
  return (await readRegistry()).plugins;
}

/** Resolve origin repo for gating (seed defaults to official). */
export function resolvePluginRepoIndexUrl(
  record: InstalledPluginRecord,
): string | null {
  if (record.repoIndexUrl) return record.repoIndexUrl;
  if (record.source === 'seed') return OFFICIAL_REPO_INDEX_URL;
  return null;
}

/** Persist enable/disable for a store-installed plugin (no-op if not in registry). */
export async function setPluginEnabled(id: string, enabled: boolean): Promise<void> {
  const reg = await readRegistry();
  const hit = reg.plugins.find((p) => p.id === id);
  if (!hit) return;
  hit.enabled = enabled;
  await writeRegistry(reg);
}

/** Remove plugin files + registry entry. Does not touch the kernel. */
export async function uninstallPlugin(id: string): Promise<void> {
  const reg = await readRegistry();
  const hit = reg.plugins.find((p) => p.id === id);
  if (hit) {
    await FileSystem.deleteAsync(pluginDirPath(hit), { idempotent: true });
  }
  reg.plugins = reg.plugins.filter((p) => p.id !== id);
  reg.skipAutoSeed = true;
  await writeRegistry(reg);
}

export async function loadPluginFromDirectory(
  absDir: string,
): Promise<{ plugin: ArgusPlugin; manifest: PluginManifest }> {
  const manifestPath = `${absDir}/manifest.json`;
  const entryPath = `${absDir}/index.js`;
  const manifestRaw = await FileSystem.readAsStringAsync(manifestPath);
  const manifest = assertManifest(JSON.parse(manifestRaw));
  const code = await FileSystem.readAsStringAsync(entryPath);
  const plugin = evaluatePluginBundle(code, manifest.id);
  // Prefer on-disk manifest as source of truth for id/version.
  (plugin as { manifest: PluginManifest }).manifest = {
    ...plugin.manifest,
    ...manifest,
  };
  return { plugin, manifest };
}

export async function installFromDirectory(
  absDir: string,
  source: InstalledPluginRecord['source'],
  opts?: { repoIndexUrl?: string },
): Promise<InstalledPluginRecord> {
  const { manifest } = await loadPluginFromDirectory(absDir);
  const dirName = manifest.id.replace(/[^a-zA-Z0-9._-]/g, '_');
  const dest = `${PLUGINS_DIR}${dirName}`;
  await ensureDir(PLUGINS_DIR);
  const destInfo = await FileSystem.getInfoAsync(dest);
  if (destInfo.exists) {
    await FileSystem.deleteAsync(dest, { idempotent: true });
  }
  await FileSystem.makeDirectoryAsync(dest, { intermediates: true });
  await FileSystem.copyAsync({ from: `${absDir}/manifest.json`, to: `${dest}/manifest.json` });
  await FileSystem.copyAsync({ from: `${absDir}/index.js`, to: `${dest}/index.js` });

  const repoIndexUrl =
    opts?.repoIndexUrl ??
    (source === 'seed' ? OFFICIAL_REPO_INDEX_URL : undefined);

  const record: InstalledPluginRecord = {
    id: manifest.id,
    version: manifest.version,
    build: manifest.build,
    dirName,
    enabled: true,
    source,
    ...(repoIndexUrl ? { repoIndexUrl } : {}),
  };
  const reg = await readRegistry();
  reg.plugins = reg.plugins.filter((p) => p.id !== record.id);
  reg.plugins.push(record);
  await writeRegistry(reg);
  return record;
}

/**
 * Copy the bundled seed plugin (official example) into the plugin store.
 * Seed files live under `assets/plugins/argus.example/` (synced from argus-plugins).
 * Reinstalls if the on-disk manifest fails validation (e.g. missing `build`).
 */
export async function ensureSeedPluginInstalled(): Promise<InstalledPluginRecord | null> {
  const reg = await readRegistry();
  if (reg.skipAutoSeed) return null;

  const existing = reg.plugins.find((p) => p.id === 'argus.example');
  if (existing) {
    try {
      const raw = await FileSystem.readAsStringAsync(
        `${pluginDirPath(existing)}/manifest.json`,
      );
      assertManifest(JSON.parse(raw));
      if (!existing.repoIndexUrl) {
        existing.repoIndexUrl = OFFICIAL_REPO_INDEX_URL;
        await writeRegistry(reg);
      }
      return existing;
    } catch (err) {
      console.warn(
        '[plugin-store] seed manifest stale — reinstalling',
        err instanceof Error ? err.message : err,
      );
      reg.plugins = reg.plugins.filter((p) => p.id !== 'argus.example');
      await writeRegistry(reg);
      await FileSystem.deleteAsync(pluginDirPath(existing), { idempotent: true });
    }
  }

  try {
    // Bundled as Metro assets (not executed as JS).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const manifestAsset = Asset.fromModule(
      require('@/assets/plugins/argus.example/manifest.json.txt'),
    );
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const codeAsset = Asset.fromModule(
      require('@/assets/plugins/argus.example/index.js.txt'),
    );
    await Promise.all([manifestAsset.downloadAsync(), codeAsset.downloadAsync()]);
    if (!manifestAsset.localUri || !codeAsset.localUri) {
      console.warn('[plugin-store] seed assets missing localUri');
      return null;
    }

    const staging = `${FileSystem.cacheDirectory}plugin-seed-argus.example/`;
    await ensureDir(staging);
    const manifestText = await FileSystem.readAsStringAsync(manifestAsset.localUri);
    const codeText = await FileSystem.readAsStringAsync(codeAsset.localUri);
    await FileSystem.writeAsStringAsync(`${staging}manifest.json`, manifestText);
    await FileSystem.writeAsStringAsync(`${staging}index.js`, codeText);
    return await installFromDirectory(staging, 'seed');
  } catch (err) {
    console.warn('[plugin-store] seed install skipped', err);
    return null;
  }
}

export function pluginDirPath(record: InstalledPluginRecord): string {
  return `${PLUGINS_DIR}${record.dirName}`;
}

export { PLUGINS_DIR };
