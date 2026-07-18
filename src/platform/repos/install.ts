import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import * as FileSystem from 'expo-file-system/legacy';
import { unzipSync } from 'fflate';

import { pluginKernel } from '@/platform/kernel';
import {
  installFromDirectory,
  listInstalled,
  loadPluginFromDirectory,
  pluginDirPath,
  uninstallPlugin,
} from '@/platform/plugins/store';
import {
  artifactDownloadUrl,
  channelCatalogUrl,
  fetchCatalog,
  latestVersion,
} from '@/platform/repos/catalog';
import { isPluginReleaseNewer, type RepoPluginVersion, type RepoPreference } from '@/platform/repos/types';
import { formatRelease } from '@/platform/repos/check-updates';

function base64ToBytes(b64: string): Uint8Array {
  const binary = globalThis.atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function ensureDir(path: string) {
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  }
}

async function writeBytes(path: string, bytes: Uint8Array): Promise<void> {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  const b64 = globalThis.btoa(binary);
  await FileSystem.writeAsStringAsync(path, b64, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

/**
 * Download a `.argus-plugin` zip, verify sha256, unpack, install to store, register.
 * Signature verification is Phase 5 — sha256 only for now.
 */
export async function installPluginFromRepo(opts: {
  pluginId: string;
  repo: RepoPreference;
  /** Defaults to latest on the selected channel. */
  version?: RepoPluginVersion;
}): Promise<{ id: string; version: string; build: number }> {
  if (!opts.repo.enabled) {
    throw new Error('Repository is disabled');
  }

  const catalogUrl = channelCatalogUrl(opts.repo);
  const catalog = await fetchCatalog(catalogUrl);
  const listing = catalog.plugins?.find((p) => p.id === opts.pluginId);
  if (!listing) {
    throw new Error(`Plugin ${opts.pluginId} not found in catalog`);
  }

  const version = opts.version ?? latestVersion(listing.versions ?? []);
  if (!version) {
    throw new Error(`No versions listed for ${opts.pluginId}`);
  }

  const existing =
    pluginKernel.getState(opts.pluginId) ??
    (await listInstalled()).find((p) => p.id === opts.pluginId);
  if (existing && !isPluginReleaseNewer(version, existing)) {
    throw new Error(
      `${opts.pluginId} is already installed (${formatRelease(existing)}). Uninstall first to reinstall.`,
    );
  }

  const downloadUrl = artifactDownloadUrl(opts.repo, version);
  const stagingRoot = `${FileSystem.cacheDirectory ?? ''}plugin-install-${opts.pluginId}/`;
  await FileSystem.deleteAsync(stagingRoot, { idempotent: true });
  await ensureDir(stagingRoot);
  const zipPath = `${stagingRoot}plugin.argus-plugin`;

  const download = await FileSystem.downloadAsync(downloadUrl, zipPath);
  if (download.status !== 200) {
    throw new Error(`Download failed HTTP ${download.status}`);
  }

  const zipB64 = await FileSystem.readAsStringAsync(zipPath, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const zipBytes = base64ToBytes(zipB64);
  const hash = bytesToHex(sha256(zipBytes));
  if (hash !== version.sha256.toLowerCase()) {
    throw new Error(
      `sha256 mismatch for ${opts.pluginId}: expected ${version.sha256}, got ${hash}`,
    );
  }

  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(zipBytes);
  } catch (err) {
    throw new Error(
      `Failed to unzip plugin: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const unpackDir = `${stagingRoot}unpacked/`;
  await ensureDir(unpackDir);

  const entries = Object.entries(files);
  const manifestEntry = entries.find(([name]) => name.endsWith('manifest.json'));
  const indexEntry = entries.find(([name]) => name.endsWith('index.js'));
  if (!manifestEntry || !indexEntry) {
    throw new Error('Plugin zip must contain manifest.json and index.js');
  }

  await writeBytes(`${unpackDir}manifest.json`, manifestEntry[1]);
  await writeBytes(`${unpackDir}index.js`, indexEntry[1]);

  if (pluginKernel.getState(opts.pluginId)) {
    await pluginKernel.unregisterPlugin(opts.pluginId);
  }
  await uninstallPlugin(opts.pluginId);

  const record = await installFromDirectory(unpackDir, 'repo', {
    repoIndexUrl: opts.repo.indexUrl,
  });
  const { plugin } = await loadPluginFromDirectory(pluginDirPath(record));
  await pluginKernel.registerPlugin(plugin, {
    repoIndexUrl: opts.repo.indexUrl,
  });

  await FileSystem.deleteAsync(stagingRoot, { idempotent: true });

  return { id: record.id, version: record.version, build: record.build };
}

export async function uninstallAndUnregister(pluginId: string): Promise<void> {
  if (pluginKernel.getState(pluginId)) {
    await pluginKernel.unregisterPlugin(pluginId);
  }
  await uninstallPlugin(pluginId);
}
