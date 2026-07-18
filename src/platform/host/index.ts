import type {
  HostContext,
  HttpClient,
  HttpRequestOptions,
  HttpResponse,
  KeyValueStore,
  Logger,
  SecureStore,
  SettingsAccess,
} from '@argus-tv/plugin-sdk';
import type { Permission } from '@argus-tv/plugin-sdk';

import { createHttpClient } from './http';
import { createLogger } from './logger';
import { createSecureStore } from './secure-store';
import { createKeyValueStore } from './cache';
import { createSettingsAccess } from './settings';

export type HostServicesOptions = {
  pluginId: string;
  permissions: readonly Permission[];
  settingsValues?: Record<string, unknown>;
};

/** Build a per-plugin `HostContext` with permission-gated services. */
export function createHostContext(opts: HostServicesOptions): HostContext {
  const log = createLogger(opts.pluginId);
  const http: HttpClient = createHttpClient(opts.pluginId, opts.permissions, log);
  const secureStore: SecureStore = createSecureStore(
    opts.pluginId,
    opts.permissions,
  );
  const cache: KeyValueStore = createKeyValueStore(opts.pluginId);
  const settings: SettingsAccess = createSettingsAccess(opts.settingsValues ?? {});

  return { http, secureStore, cache, log, settings };
}

export {
  createHttpClient,
  createLogger,
  createSecureStore,
  createKeyValueStore,
  createSettingsAccess,
};
