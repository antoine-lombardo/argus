import { create } from 'zustand';

export type SearchStatus = 'idle' | 'loading' | 'ready' | 'error';

type SearchState = {
  query: string;
  status: SearchStatus;
  /** Placeholder until plugin kernel + aggregator exist. */
  results: unknown[];
  error: string | null;
  setQuery: (query: string) => void;
  setStatus: (status: SearchStatus) => void;
  setResults: (results: unknown[]) => void;
  setError: (error: string | null) => void;
  reset: () => void;
};

const initial = {
  query: '',
  status: 'idle' as SearchStatus,
  results: [] as unknown[],
  error: null as string | null,
};

export const useSearchStore = create<SearchState>((set) => ({
  ...initial,
  setQuery: (query) => set({ query }),
  setStatus: (status) => set({ status }),
  setResults: (results) => set({ results, status: 'ready', error: null }),
  setError: (error) => set({ error, status: 'error' }),
  reset: () => set(initial),
}));
