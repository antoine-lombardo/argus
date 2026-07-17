import { create } from 'zustand';

type FocusRestoreState = {
  /**
   * Media key (`mediaIdKey`) to prefer-focus when a list screen remounts
   * after leaving Detail.
   */
  pendingMediaKey: string | null;
  remember: (key: string) => void;
  clear: () => void;
};

/** Remembers which poster opened Detail so Back can restore focus. */
export const useFocusRestoreStore = create<FocusRestoreState>((set) => ({
  pendingMediaKey: null,
  remember: (pendingMediaKey) => set({ pendingMediaKey }),
  clear: () => set({ pendingMediaKey: null }),
}));
