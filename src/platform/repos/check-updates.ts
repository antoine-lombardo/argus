import {
  channelCatalogUrl,
  fetchCatalog,
  latestVersion,
} from '@/platform/repos/catalog';
import {
  isPluginReleaseNewer,
  type RepoPluginVersion,
  type RepoPreference,
} from '@/platform/repos/types';

export type PluginUpdateCheck =
  | {
      status: 'up-to-date';
      installed: { version: string; build: number };
      latest: RepoPluginVersion;
      repoName: string;
      repoIndexUrl: string;
      channelId: string;
    }
  | {
      status: 'update-available';
      installed: { version: string; build: number };
      latest: RepoPluginVersion;
      repoName: string;
      repoIndexUrl: string;
      channelId: string;
    }
  | { status: 'not-in-catalog'; installed: { version: string; build: number } }
  | { status: 'no-enabled-repos' }
  | { status: 'error'; message: string };

/**
 * Check enabled repos (selected channel) for a newer build of `pluginId`.
 */
export async function checkPluginUpdates(opts: {
  pluginId: string;
  installed: { version: string; build: number };
  repos: RepoPreference[];
}): Promise<PluginUpdateCheck> {
  const enabled = opts.repos.filter((r) => r.enabled);
  if (enabled.length === 0) return { status: 'no-enabled-repos' };

  try {
    let best:
      | {
          latest: RepoPluginVersion;
          repoName: string;
          repoIndexUrl: string;
          channelId: string;
        }
      | undefined;

    for (const repo of enabled) {
      const url = channelCatalogUrl(repo);
      const catalog = await fetchCatalog(url);
      const listing = catalog.plugins?.find((p) => p.id === opts.pluginId);
      const candidate = listing ? latestVersion(listing.versions ?? []) : undefined;
      if (!candidate) continue;
      if (
        !best ||
        isPluginReleaseNewer(candidate, {
          version: best.latest.version,
          build: best.latest.build,
        })
      ) {
        best = {
          latest: candidate,
          repoName: repo.name ?? catalog.name ?? repo.indexUrl,
          repoIndexUrl: repo.indexUrl,
          channelId: repo.selectedChannelId,
        };
      }
    }

    if (!best) {
      return { status: 'not-in-catalog', installed: opts.installed };
    }

    if (isPluginReleaseNewer(best.latest, opts.installed)) {
      return {
        status: 'update-available',
        installed: opts.installed,
        latest: best.latest,
        repoName: best.repoName,
        repoIndexUrl: best.repoIndexUrl,
        channelId: best.channelId,
      };
    }

    return {
      status: 'up-to-date',
      installed: opts.installed,
      latest: best.latest,
      repoName: best.repoName,
      repoIndexUrl: best.repoIndexUrl,
      channelId: best.channelId,
    };
  } catch (err) {
    return {
      status: 'error',
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

export function formatRelease(v: { version: string; build: number }): string {
  return `${v.version}+${v.build}`;
}
