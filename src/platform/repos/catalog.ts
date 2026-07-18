import {
  MAIN_CHANNEL_ID,
  isPluginReleaseNewer,
  type RepoIndex,
  type RepoPluginListing,
  type RepoPluginVersion,
  type RepoPreference,
} from '@/platform/repos/types';

export function channelCatalogUrl(repo: RepoPreference): string {
  if (repo.selectedChannelId === MAIN_CHANNEL_ID) return repo.indexUrl;
  const ref = repo.channels?.find((c) => c.id === repo.selectedChannelId);
  if (!ref?.index) return repo.indexUrl;
  return new URL(ref.index, repo.indexUrl).href;
}

/** Artifact paths are relative to the main index, not the channel file. */
export function artifactDownloadUrl(
  repo: RepoPreference,
  version: RepoPluginVersion,
): string {
  if (/^https?:\/\//i.test(version.url)) return version.url;
  return new URL(version.url, repo.indexUrl).href;
}

export async function fetchCatalog(url: string): Promise<RepoIndex> {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  return (await res.json()) as RepoIndex;
}

export function latestVersion(
  versions: RepoPluginVersion[],
): RepoPluginVersion | undefined {
  if (!versions.length) return undefined;
  return versions.reduce((best, v) =>
    isPluginReleaseNewer(v, best) ? v : best,
  );
}

export type CatalogEntry = {
  pluginId: string;
  name: string;
  description?: string;
  repoIndexUrl: string;
  repoName: string;
  channelId: string;
  latest: RepoPluginVersion;
};

/**
 * Flatten latest listings from enabled repos (selected channels).
 * If the same pluginId appears in multiple repos, keep the newer release.
 */
export async function listCatalogEntries(
  repos: RepoPreference[],
): Promise<CatalogEntry[]> {
  const enabled = repos.filter((r) => r.enabled);
  const byId = new Map<string, CatalogEntry>();

  for (const repo of enabled) {
    const url = channelCatalogUrl(repo);
    const catalog = await fetchCatalog(url);
    for (const listing of catalog.plugins ?? []) {
      const latest = latestVersion(listing.versions ?? []);
      if (!latest) continue;
      const entry: CatalogEntry = {
        pluginId: listing.id,
        name: listing.name,
        description: listing.description,
        repoIndexUrl: repo.indexUrl,
        repoName: repo.name ?? catalog.name ?? repo.indexUrl,
        channelId: repo.selectedChannelId,
        latest,
      };
      const prev = byId.get(listing.id);
      if (!prev || isPluginReleaseNewer(entry.latest, prev.latest)) {
        byId.set(listing.id, entry);
      }
    }
  }

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function findListing(
  catalog: RepoIndex,
  pluginId: string,
): RepoPluginListing | undefined {
  return catalog.plugins?.find((p) => p.id === pluginId);
}
