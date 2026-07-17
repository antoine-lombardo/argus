import { create } from 'zustand';

export type LibraryItemRef = {
  /** Opaque until domain MediaId is wired from the SDK. */
  id: string;
};

type LibraryState = {
  favorites: LibraryItemRef[];
  continueWatching: LibraryItemRef[];
  addFavorite: (item: LibraryItemRef) => void;
  removeFavorite: (id: string) => void;
  setContinueWatching: (items: LibraryItemRef[]) => void;
  reset: () => void;
};

const initial = {
  favorites: [] as LibraryItemRef[],
  continueWatching: [] as LibraryItemRef[],
};

export const useLibraryStore = create<LibraryState>((set) => ({
  ...initial,
  addFavorite: (item) =>
    set((s) =>
      s.favorites.some((f) => f.id === item.id)
        ? s
        : { favorites: [...s.favorites, item] },
    ),
  removeFavorite: (id) =>
    set((s) => ({ favorites: s.favorites.filter((f) => f.id !== id) })),
  setContinueWatching: (continueWatching) => set({ continueWatching }),
  reset: () => set(initial),
}));
