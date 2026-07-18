import type { SettingsAccess } from '@argus-tv/plugin-sdk';

/** Read-only view of user-configured plugin settings (persisted by host). */
export function createSettingsAccess(
  values: Record<string, unknown>,
): SettingsAccess {
  return {
    get<T = unknown>(key: string): T | undefined {
      return values[key] as T | undefined;
    },
    all(): Record<string, unknown> {
      return { ...values };
    },
  };
}
