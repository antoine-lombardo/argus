import Constants from 'expo-constants';

/**
 * How the host loads plugins at boot.
 *
 * - `auto` (default): `__DEV__` → try Metro HMR example; else plugin store / seed
 * - `hmr`: in `__DEV__` only, prefer Metro HMR (falls back to store). **Ignored in production.**
 * - `store`: always use on-device plugin store / seed (prod-like, even in `__DEV__`)
 *
 * Set via env (restart Metro after changing):
 *   EXPO_PUBLIC_ARGUS_PLUGIN_LOAD=store
 *
 * Production / release builds never use Metro HMR, regardless of this value.
 */
export type PluginLoadMode = 'auto' | 'hmr' | 'store';

export function getPluginLoadMode(): PluginLoadMode {
  const fromExtra = Constants.expoConfig?.extra?.argusPluginLoad;
  const fromEnv = process.env.EXPO_PUBLIC_ARGUS_PLUGIN_LOAD;
  const raw = (fromEnv ?? fromExtra ?? 'auto').toString().trim().toLowerCase();
  if (raw === 'hmr' || raw === 'store' || raw === 'auto') return raw;
  return 'auto';
}

/**
 * Metro sibling example path. Hard-gated on `__DEV__` so release builds
 * cannot enable it via env / extra.
 */
export function shouldTryDevHmr(): boolean {
  if (!__DEV__) return false;
  const mode = getPluginLoadMode();
  if (mode === 'store') return false;
  // `auto` and `hmr` both try HMR in development only.
  return true;
}
