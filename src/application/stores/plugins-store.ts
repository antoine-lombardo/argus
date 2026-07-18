import { create } from 'zustand';

import { pluginKernel, type PluginRuntimeState } from '@/platform/kernel';

type PluginsState = {
  installed: PluginRuntimeState[];
  syncFromKernel: () => void;
  enable: (id: string) => Promise<void>;
  disable: (id: string) => Promise<void>;
  toggle: (id: string) => Promise<void>;
};

function snapshot(): PluginRuntimeState[] {
  return pluginKernel.list();
}

export const usePluginsStore = create<PluginsState>((set) => ({
  installed: snapshot(),
  syncFromKernel: () => set({ installed: snapshot() }),
  enable: async (id) => {
    await pluginKernel.enable(id);
    set({ installed: snapshot() });
  },
  disable: async (id) => {
    await pluginKernel.disable(id);
    set({ installed: snapshot() });
  },
  toggle: async (id) => {
    await pluginKernel.toggle(id);
    set({ installed: snapshot() });
  },
}));

/** Keep the Zustand list in sync when the kernel auto-disables (breaker). */
pluginKernel.subscribe(() => {
  usePluginsStore.getState().syncFromKernel();
});
