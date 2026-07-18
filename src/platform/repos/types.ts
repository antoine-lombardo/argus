/**
 * Repo index / channel types (GitHub Pages catalog).
 * @see docs/adr/0008-plugin-version-build-channels.md
 */

export type RepoChannelRef = {
  id: string;
  name: string;
  description?: string;
  /** Relative path from the main index URL, e.g. `channels/experimental.json`. */
  index: string;
};

export type RepoPluginVersion = {
  version: string;
  build: number;
  apiVersion: string;
  platforms: string[];
  url: string;
  sha256: string;
  minHostVersion?: string;
};

export type RepoPluginListing = {
  id: string;
  name: string;
  description?: string;
  versions: RepoPluginVersion[];
};

/** Main `index.json` — always the main channel + optional extra channel directory. */
export type RepoIndex = {
  apiVersion: string;
  id: string;
  name: string;
  description?: string;
  /** Non-main channels only. Empty/omitted ⇒ no channel picker in the host. */
  channels?: RepoChannelRef[];
  plugins: RepoPluginListing[];
};

/** Extra channel catalog file (same plugin list shape; no `channels` directory required). */
export type RepoChannelIndex = {
  apiVersion: string;
  id: string;
  name: string;
  description?: string;
  plugins: RepoPluginListing[];
};

export const MAIN_CHANNEL_ID = 'main' as const;

export type SelectedChannelId = typeof MAIN_CHANNEL_ID | string;

/** Per-repo user preference persisted in the host. */
export type RepoPreference = {
  /** Absolute HTTPS URL to the repo's main `index.json`. */
  indexUrl: string;
  /** Display name from last fetch (optional until Phase 4 fetch). */
  name?: string;
  /** `main` or an id from `channels[]`. */
  selectedChannelId: SelectedChannelId;
  /** Cached channel directory from last main-index fetch. */
  channels?: RepoChannelRef[];
};

/**
 * True if `candidate` is newer than `installed` using (version, build).
 * Semver is compared as major.minor.patch numeric tuples (0.x friendly).
 */
export function isPluginReleaseNewer(
  candidate: { version: string; build: number },
  installed: { version: string; build: number },
): boolean {
  const cmp = compareSemver(candidate.version, installed.version);
  if (cmp > 0) return true;
  if (cmp < 0) return false;
  return candidate.build > installed.build;
}

function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map((n) => Number.parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => Number.parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d > 0 ? 1 : -1;
  }
  return 0;
}

/** Whether the Settings UI should show a channel picker for this repo. */
export function shouldShowChannelPicker(channels: RepoChannelRef[] | undefined): boolean {
  return Array.isArray(channels) && channels.length >= 1;
}
