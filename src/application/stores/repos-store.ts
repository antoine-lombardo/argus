import { create } from 'zustand';

import {
  MAIN_CHANNEL_ID,
  type RepoChannelRef,
  type RepoPreference,
  type SelectedChannelId,
} from '@/platform/repos/types';

/** Default official catalog (GitHub Pages). */
export const OFFICIAL_REPO_INDEX_URL =
  'https://antoine-lombardo.github.io/argus-repo-index/index.json';

const DEFAULT_OFFICIAL: RepoPreference = {
  indexUrl: OFFICIAL_REPO_INDEX_URL,
  name: 'Argus Official',
  selectedChannelId: MAIN_CHANNEL_ID,
  // Seeded so Settings can show the picker before Phase 4 fetch lands.
  // Live fetch will replace this from index.json `channels`.
  channels: [
    {
      id: 'experimental',
      name: 'Experimental',
      description: 'Builds from the argus-plugins dev branch.',
      index: 'channels/experimental.json',
    },
  ],
};

type ReposState = {
  repos: RepoPreference[];
  setChannel: (indexUrl: string, channelId: SelectedChannelId) => void;
  setChannelsFromIndex: (indexUrl: string, channels: RepoChannelRef[]) => void;
  reset: () => void;
};

export const useReposStore = create<ReposState>((set) => ({
  repos: [DEFAULT_OFFICIAL],
  setChannel: (indexUrl, channelId) =>
    set((s) => ({
      repos: s.repos.map((r) =>
        r.indexUrl === indexUrl ? { ...r, selectedChannelId: channelId } : r,
      ),
    })),
  setChannelsFromIndex: (indexUrl, channels) =>
    set((s) => ({
      repos: s.repos.map((r) =>
        r.indexUrl === indexUrl ? { ...r, channels } : r,
      ),
    })),
  reset: () => set({ repos: [DEFAULT_OFFICIAL] }),
}));
