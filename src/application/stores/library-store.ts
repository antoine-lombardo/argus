import type { MediaItem } from '@argus-tv/plugin-sdk';
import { create } from 'zustand';

import {
  libraryContinueWatching,
  libraryFavorites,
} from '@/domain/fixtures/library';
import { mediaIdKey } from '@/domain/media-id';

export type LibraryItemRef = {
  /** `mediaIdKey` string until library persists real MediaIds. */
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

function toRefs(items: MediaItem[]): LibraryItemRef[] {
  return items.map((item) => ({ id: mediaIdKey(item.id) }));
}

const seeded = {
  favorites: toRefs(libraryFavorites),
  continueWatching: toRefs(libraryContinueWatching),
};

export const useLibraryStore = create<LibraryState>((set) => ({
  ...seeded,
  addFavorite: (item) =>
    set((s) =>
      s.favorites.some((f) => f.id === item.id)
        ? s
        : { favorites: [...s.favorites, item] },
    ),
  removeFavorite: (id) =>
    set((s) => ({ favorites: s.favorites.filter((f) => f.id !== id) })),
  setContinueWatching: (continueWatching) => set({ continueWatching }),
  reset: () => set(seeded),
}));
