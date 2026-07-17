import { useIsFocused } from 'expo-router';
import { useCallback } from 'react';

import { useFocusRestoreStore } from '@/application/stores/focus-restore-store';

/**
 * While this screen is focused, prefer-focus the poster that opened Detail.
 * Works with a Stack (list stays mounted): restore runs on focus regain, not remount.
 */
export function useRestoreFocusKey() {
  const isFocused = useIsFocused();
  const pendingMediaKey = useFocusRestoreStore((s) => s.pendingMediaKey);
  const clear = useFocusRestoreStore((s) => s.clear);

  const restoreKey = isFocused ? pendingMediaKey : null;

  const shouldRestore = useCallback(
    (key: string) => restoreKey != null && key === restoreKey,
    [restoreKey],
  );

  const onRestoredFocus = useCallback(
    (key: string) => {
      if (key === pendingMediaKey) clear();
    },
    [pendingMediaKey, clear],
  );

  return { restoreKey, shouldRestore, onRestoredFocus };
}
