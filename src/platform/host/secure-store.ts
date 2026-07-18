import type { Permission, SecureStore } from '@argus-tv/plugin-sdk';
import { ArgusError } from '@argus-tv/plugin-sdk';
import * as ExpoSecureStore from 'expo-secure-store';

/**
 * Per-plugin secure namespace backed by expo-secure-store.
 * Keys are prefixed and sanitized for platform limits (see ADR 0007).
 */
export function createSecureStore(
  pluginId: string,
  permissions: readonly Permission[],
): SecureStore {
  const allowed = permissions.includes('secureStorage');
  const prefix = `argus.p.${sanitize(pluginId)}.`;

  const fullKey = (key: string) => {
    const combined = `${prefix}${sanitize(key)}`;
    // iOS keychain account names should stay reasonably short.
    if (combined.length <= 128) return combined;
    return `${prefix}${simpleHash(key)}`;
  };

  return {
    async get(key: string): Promise<string | null> {
      assertAllowed(allowed, pluginId);
      return ExpoSecureStore.getItemAsync(fullKey(key));
    },
    async set(key: string, value: string): Promise<void> {
      assertAllowed(allowed, pluginId);
      await ExpoSecureStore.setItemAsync(fullKey(key), value);
    },
    async delete(key: string): Promise<void> {
      assertAllowed(allowed, pluginId);
      await ExpoSecureStore.deleteItemAsync(fullKey(key));
    },
  };
}

function assertAllowed(allowed: boolean, pluginId: string) {
  if (!allowed) {
    throw new ArgusError(
      'PLUGIN_ERROR',
      `Plugin ${pluginId} lacks secureStorage permission`,
    );
  }
}

function sanitize(input: string): string {
  return input.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 64);
}

function simpleHash(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}
