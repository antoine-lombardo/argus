import { create } from 'zustand';

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
  reset: () => void;
};

const initial = {
  installed: [] as PluginEntry[],
};

export const usePluginsStore = create<PluginsState>((set) => ({
  ...initial,
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
  reset: () => set(initial),
}));
