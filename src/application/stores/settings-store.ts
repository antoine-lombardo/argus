import { create } from 'zustand';

type SettingsState = {
  /** Auto-play next episode when one ends (placeholder — player not wired yet). */
  autoplayNext: boolean;
  /** Prefer reduced motion in UI transitions (placeholder). */
  reduceMotion: boolean;
  toggleAutoplayNext: () => void;
  toggleReduceMotion: () => void;
  reset: () => void;
};

const initial = {
  autoplayNext: true,
  reduceMotion: false,
};

export const useSettingsStore = create<SettingsState>((set) => ({
  ...initial,
  toggleAutoplayNext: () =>
    set((s) => ({ autoplayNext: !s.autoplayNext })),
  toggleReduceMotion: () =>
    set((s) => ({ reduceMotion: !s.reduceMotion })),
  reset: () => set(initial),
}));
