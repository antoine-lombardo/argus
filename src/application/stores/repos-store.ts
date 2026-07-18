import * as FileSystem from 'expo-file-system/legacy';
import { create } from 'zustand';

import { OFFICIAL_REPO_INDEX_URL } from '@/platform/repos/constants';
import { syncPluginsWithRepos } from '@/platform/repos/plugin-gate';
import {
  MAIN_CHANNEL_ID,
  type RepoChannelRef,
  type RepoPreference,
  type SelectedChannelId,
} from '@/platform/repos/types';

export { OFFICIAL_REPO_INDEX_URL };

const PREFS_FILE = `${FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? ''}repos-prefs.json`;

const DEFAULT_OFFICIAL: RepoPreference = {
  indexUrl: OFFICIAL_REPO_INDEX_URL,
  name: 'Argus Official',
  enabled: true,
  selectedChannelId: MAIN_CHANNEL_ID,
  channels: [
    {
      id: 'experimental',
      name: 'Experimental',
      description: 'Builds from the argus-plugins dev branch.',
      index: 'channels/experimental.json',
    },
  ],
};

type PersistedRepos = {
  repos: Array<{
    indexUrl: string;
    enabled: boolean;
    selectedChannelId: SelectedChannelId;
  }>;
};

type ReposState = {
  repos: RepoPreference[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  getByUrl: (indexUrl: string) => RepoPreference | undefined;
  setEnabled: (indexUrl: string, enabled: boolean) => void;
  setChannel: (indexUrl: string, channelId: SelectedChannelId) => void;
  setChannelsFromIndex: (indexUrl: string, channels: RepoChannelRef[]) => void;
  reset: () => void;
};

async function readPersisted(): Promise<PersistedRepos | null> {
  try {
    const info = await FileSystem.getInfoAsync(PREFS_FILE);
    if (!info.exists) return null;
    const raw = await FileSystem.readAsStringAsync(PREFS_FILE);
    return JSON.parse(raw) as PersistedRepos;
  } catch {
    return null;
  }
}

async function writePersisted(repos: RepoPreference[]): Promise<void> {
  const payload: PersistedRepos = {
    repos: repos.map((r) => ({
      indexUrl: r.indexUrl,
      enabled: r.enabled,
      selectedChannelId: r.selectedChannelId,
    })),
  };
  await FileSystem.writeAsStringAsync(PREFS_FILE, JSON.stringify(payload, null, 2));
}

function mergeDefaults(persisted: PersistedRepos | null): RepoPreference[] {
  const base: RepoPreference[] = [
    {
      ...DEFAULT_OFFICIAL,
      channels: [...(DEFAULT_OFFICIAL.channels ?? [])],
    },
  ];
  if (!persisted?.repos?.length) return base;
  return base.map((repo) => {
    const saved = persisted.repos.find((p) => p.indexUrl === repo.indexUrl);
    if (!saved) return repo;
    return {
      ...repo,
      enabled: saved.enabled !== false,
      selectedChannelId: saved.selectedChannelId,
    };
  });
}

function patchRepo(
  repos: RepoPreference[],
  indexUrl: string,
  patch: Partial<RepoPreference>,
): RepoPreference[] {
  return repos.map((r) => (r.indexUrl === indexUrl ? { ...r, ...patch } : r));
}

export const useReposStore = create<ReposState>((set, get) => ({
  repos: [DEFAULT_OFFICIAL],
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) return;
    const persisted = await readPersisted();
    const repos = mergeDefaults(persisted);
    set({ repos, hydrated: true });
    await syncPluginsWithRepos(repos);
  },
  getByUrl: (indexUrl) => get().repos.find((r) => r.indexUrl === indexUrl),
  setEnabled: (indexUrl, enabled) => {
    const repos = patchRepo(get().repos, indexUrl, { enabled });
    set({ repos });
    void writePersisted(repos);
    void syncPluginsWithRepos(repos);
  },
  setChannel: (indexUrl, channelId) => {
    set((s) => {
      const repos = patchRepo(s.repos, indexUrl, {
        selectedChannelId: channelId,
      });
      void writePersisted(repos);
      return { repos };
    });
  },
  setChannelsFromIndex: (indexUrl, channels) =>
    set((s) => ({
      repos: patchRepo(s.repos, indexUrl, { channels }),
    })),
  reset: () => {
    set({ repos: [DEFAULT_OFFICIAL], hydrated: true });
    void writePersisted([DEFAULT_OFFICIAL]);
    void syncPluginsWithRepos([DEFAULT_OFFICIAL]);
  },
}));
