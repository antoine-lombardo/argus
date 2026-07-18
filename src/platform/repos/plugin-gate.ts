import { pluginKernel } from '@/platform/kernel';
import {
  listInstalled,
  resolvePluginRepoIndexUrl,
  type InstalledPluginRecord,
} from '@/platform/plugins/store';
import { OFFICIAL_REPO_INDEX_URL } from '@/platform/repos/constants';

import type { RepoPreference } from './types';

const REPO_DISABLED_REASON = 'Repository disabled';

/**
 * Resolve which repo gates a runtime plugin (kernel state, registry, or known seed id).
 */
export function resolveOriginRepoUrl(
  plugin: { id: string; repoIndexUrl?: string | null },
  registry: InstalledPluginRecord[] = [],
): string | null {
  if (plugin.repoIndexUrl) return plugin.repoIndexUrl;
  const record = registry.find((r) => r.id === plugin.id);
  if (record) return resolvePluginRepoIndexUrl(record);
  // Seed / HMR example before registry backfill.
  if (plugin.id === 'argus.example') return OFFICIAL_REPO_INDEX_URL;
  return null;
}

/**
 * Disable plugins whose origin repo is off; restore enable state when the repo is on.
 * Sideload / unbound plugins are left alone.
 */
export async function syncPluginsWithRepos(
  repos: RepoPreference[],
): Promise<void> {
  const enabledUrls = new Set(
    repos.filter((r) => r.enabled).map((r) => r.indexUrl),
  );
  const installed = await listInstalled();
  const byId = new Map(installed.map((p) => [p.id, p]));

  for (const record of installed) {
    const repoUrl = resolvePluginRepoIndexUrl(record);
    if (repoUrl && pluginKernel.getState(record.id)) {
      pluginKernel.setRepoIndexUrl(record.id, repoUrl);
    }
    await applyRecord(record, enabledUrls);
  }

  // HMR / in-memory plugins may not be in the store registry yet.
  for (const state of pluginKernel.list()) {
    const repoUrl = resolveOriginRepoUrl(state, installed);
    if (repoUrl && !state.repoIndexUrl) {
      pluginKernel.setRepoIndexUrl(state.id, repoUrl);
    }
    if (!repoUrl) continue;
    if (byId.has(state.id)) continue;
    if (!enabledUrls.has(repoUrl)) {
      const fresh = pluginKernel.getState(state.id);
      if (
        fresh &&
        (fresh.enabled || fresh.disabledReason !== REPO_DISABLED_REASON)
      ) {
        await pluginKernel.disable(state.id, REPO_DISABLED_REASON);
      }
    }
  }
}

async function applyRecord(
  record: InstalledPluginRecord,
  enabledUrls: Set<string>,
): Promise<void> {
  const repoUrl = resolvePluginRepoIndexUrl(record);
  if (!repoUrl) return;
  if (!pluginKernel.getState(record.id)) return;

  if (!enabledUrls.has(repoUrl)) {
    await pluginKernel.disable(record.id, REPO_DISABLED_REASON);
    return;
  }

  if (record.enabled) {
    await pluginKernel.enable(record.id);
  } else {
    await pluginKernel.disable(record.id, 'Disabled in settings');
  }
}

/** True when the plugin may appear in Settings / be user-toggled. */
export function isPluginRepoAvailable(
  plugin: { id: string; repoIndexUrl?: string | null },
  repos: RepoPreference[],
  registry: InstalledPluginRecord[] = [],
): boolean {
  const repoIndexUrl = resolveOriginRepoUrl(plugin, registry);
  if (!repoIndexUrl) return true;
  const repo = repos.find((r) => r.indexUrl === repoIndexUrl);
  // Unknown URL (removed repo) — keep visible so the user can uninstall later.
  if (!repo) return true;
  return repo.enabled;
}
