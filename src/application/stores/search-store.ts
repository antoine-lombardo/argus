import type { MediaItem } from '@argus-tv/plugin-sdk';
import { create } from 'zustand';

export type SearchStatus = 'idle' | 'loading' | 'ready' | 'error';

type SearchState = {
  query: string;
  status: SearchStatus;
  results: MediaItem[];
  error: string | null;
  setQuery: (query: string) => void;
  appendChar: (char: string) => void;
  backspace: () => void;
  clearQuery: () => void;
  setStatus: (status: SearchStatus) => void;
  setResults: (results: MediaItem[]) => void;
  setError: (error: string | null) => void;
  reset: () => void;
};

const initial = {
  query: '',
  status: 'idle' as SearchStatus,
  results: [] as MediaItem[],
  error: null as string | null,
};

export const useSearchStore = create<SearchState>((set) => ({
  ...initial,
  setQuery: (query) => set({ query, status: query ? 'loading' : 'idle' }),
  appendChar: (char) =>
    set((s) => {
      const query = s.query + char;
      return { query, status: 'loading' as const };
    }),
  backspace: () =>
    set((s) => {
      const query = s.query.slice(0, -1);
      return { query, status: query ? ('loading' as const) : ('idle' as const) };
    }),
  clearQuery: () => set({ query: '', status: 'idle', results: [], error: null }),
  setStatus: (status) => set({ status }),
  setResults: (results) => set({ results, status: 'ready', error: null }),
  setError: (error) => set({ error, status: 'error' }),
  reset: () => set(initial),
}));
