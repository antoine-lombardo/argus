import { create } from 'zustand';

import { fixturePlugins } from '@/domain/fixtures/plugins';

export type PluginEntry = {
  id: string;
  name: string;
  enabled: boolean;
  version?: string;
};

type PluginsState = {
  installed: PluginEntry[];
  setInstalled: (installed: PluginEntry[]) => void;
  enable: (id: string) => void;
  disable: (id: string) => void;
  toggle: (id: string) => void;
  reset: () => void;
};

const seeded: PluginEntry[] = fixturePlugins.map((p) => ({ ...p }));

export const usePluginsStore = create<PluginsState>((set) => ({
  installed: seeded,
  setInstalled: (installed) => set({ installed }),
  enable: (id) =>
    set((s) => ({
      installed: s.installed.map((p) =>
        p.id === id ? { ...p, enabled: true } : p,
      ),
    })),
  disable: (id) =>
    set((s) => ({
      installed: s.installed.map((p) =>
        p.id === id ? { ...p, enabled: false } : p,
      ),
    })),
  toggle: (id) =>
    set((s) => ({
      installed: s.installed.map((p) =>
        p.id === id ? { ...p, enabled: !p.enabled } : p,
      ),
    })),
  reset: () => set({ installed: seeded.map((p) => ({ ...p })) }),
}));
