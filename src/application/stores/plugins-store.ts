import { create } from 'zustand';

import { useReposStore } from '@/application/stores/repos-store';
import { pluginKernel, type PluginRuntimeState } from '@/platform/kernel';
import {
  listInstalled,
  setPluginEnabled,
  type InstalledPluginRecord,
} from '@/platform/plugins/store';
import {
  installPluginFromRepo,
  uninstallAndUnregister,
} from '@/platform/repos/install';
import { isPluginRepoAvailable } from '@/platform/repos/plugin-gate';

type PluginsState = {
  installed: PluginRuntimeState[];
  registry: InstalledPluginRecord[];
  syncFromKernel: () => void;
  refreshRegistry: () => Promise<void>;
  enable: (id: string) => Promise<void>;
  disable: (id: string) => Promise<void>;
  toggle: (id: string) => Promise<void>;
  installFromCatalog: (pluginId: string, repoIndexUrl: string) => Promise<void>;
  uninstall: (id: string) => Promise<void>;
};

function snapshot(): PluginRuntimeState[] {
  return pluginKernel.list();
}

function assertRepoAvailable(id: string) {
  const state = pluginKernel.getState(id);
  if (!state) return;
  const repos = useReposStore.getState().repos;
  const registry = usePluginsStore.getState().registry;
  if (!isPluginRepoAvailable(state, repos, registry)) {
    throw new Error('Repository disabled');
  }
}

export const usePluginsStore = create<PluginsState>((set) => ({
  installed: snapshot(),
  registry: [],
  syncFromKernel: () => set({ installed: snapshot() }),
  refreshRegistry: async () => {
    const registry = await listInstalled();
    set({ registry });
  },
  enable: async (id) => {
    assertRepoAvailable(id);
    await pluginKernel.enable(id);
    await setPluginEnabled(id, true);
    set({ installed: snapshot() });
  },
  disable: async (id) => {
    await pluginKernel.disable(id, 'Disabled in settings');
    await setPluginEnabled(id, false);
    set({ installed: snapshot() });
  },
  toggle: async (id) => {
    const before = pluginKernel.getState(id)?.enabled ?? false;
    if (before) {
      await pluginKernel.disable(id, 'Disabled in settings');
      await setPluginEnabled(id, false);
    } else {
      assertRepoAvailable(id);
      await pluginKernel.enable(id);
      await setPluginEnabled(id, true);
    }
    set({ installed: snapshot() });
  },
  installFromCatalog: async (pluginId, repoIndexUrl) => {
    const repo = useReposStore.getState().repos.find((r) => r.indexUrl === repoIndexUrl);
    if (!repo) throw new Error('Unknown repository');
    await installPluginFromRepo({ pluginId, repo });
    const registry = await listInstalled();
    set({ installed: snapshot(), registry });
  },
  uninstall: async (id) => {
    await uninstallAndUnregister(id);
    const registry = await listInstalled();
    set({ installed: snapshot(), registry });
  },
}));

/** Keep the Zustand list in sync when the kernel auto-disables (breaker). */
pluginKernel.subscribe(() => {
  usePluginsStore.getState().syncFromKernel();
});
