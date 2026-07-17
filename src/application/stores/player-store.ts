import { create } from 'zustand';

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

type PlayerState = {
  status: PlayerStatus;
  /** Opaque stream / media ref until StreamDescriptor is wired. */
  mediaId: string | null;
  positionMs: number;
  durationMs: number | null;
  error: string | null;
  setStatus: (status: PlayerStatus) => void;
  setMedia: (mediaId: string | null) => void;
  setPosition: (positionMs: number) => void;
  setDuration: (durationMs: number | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
};

const initial = {
  status: 'idle' as PlayerStatus,
  mediaId: null as string | null,
  positionMs: 0,
  durationMs: null as number | null,
  error: null as string | null,
};

export const usePlayerStore = create<PlayerState>((set) => ({
  ...initial,
  setStatus: (status) => set({ status }),
  setMedia: (mediaId) => set({ mediaId }),
  setPosition: (positionMs) => set({ positionMs }),
  setDuration: (durationMs) => set({ durationMs }),
  setError: (error) => set({ error, status: 'error' }),
  reset: () => set(initial),
}));
