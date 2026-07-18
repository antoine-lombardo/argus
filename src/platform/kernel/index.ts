import type {
  ArgusPlugin,
  Capability,
  MediaId,
  MediaItem,
  PluginManifest,
  Row,
  SearchOptions,
  StreamDescriptor,
  MediaDetails,
  LiveEvent,
  TimeoutKey,
} from '@argus-tv/plugin-sdk';
import {
  API_VERSION,
  ArgusError,
  DEFAULT_TIMEOUTS,
} from '@argus-tv/plugin-sdk';

import { createHostContext } from '@/platform/host';
import { isArgusError, isExpectedArgusError } from '@/platform/sdk/errors';

import { assertManifest } from './manifest';
import { guardMediaItems, guardRows } from './result-guard';

const BREAKER_THRESHOLD = 3;

const METHOD_CAPABILITY: Record<string, Capability> = {
  search: 'search',
  getHomeRows: 'catalog',
  getDetails: 'catalog',
  getPlayback: 'vod',
  getLive: 'live',
  getAuthState: 'auth',
  login: 'auth',
  logout: 'auth',
  getContinueWatching: 'library',
  reportProgress: 'library',
};

export type RegisterPluginOptions = {
  /** Origin repo index URL; used to hide/disable when that repo is off. */
  repoIndexUrl?: string | null;
};

export type PluginRuntimeState = {
  id: string;
  name: string;
  version: string;
  build: number;
  enabled: boolean;
  initialized: boolean;
  consecutiveFailures: number;
  disabledReason: string | null;
  lastError: string | null;
  /** Origin repo; null = not gated by repo enable (e.g. sideload). */
  repoIndexUrl: string | null;
};

type Registered = {
  plugin: ArgusPlugin;
  state: PluginRuntimeState;
  inFlight: number;
};

type Listener = () => void;

/**
 * In-process plugin kernel: register, enable/disable, timed calls,
 * duck-typed errors, circuit breaker (unexpected failures only).
 */
class PluginKernel {
  private readonly plugins = new Map<string, Registered>();
  private readonly listeners = new Set<Listener>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    for (const l of this.listeners) l();
  }

  list(): PluginRuntimeState[] {
    return [...this.plugins.values()].map((r) => ({ ...r.state }));
  }

  getState(id: string): PluginRuntimeState | undefined {
    const r = this.plugins.get(id);
    return r ? { ...r.state } : undefined;
  }

  /**
   * Register a pre-built `ArgusPlugin` (Phase 3: static import;
   * Phase 4: same entry after loading from disk).
   */
  async registerPlugin(
    plugin: ArgusPlugin,
    opts?: RegisterPluginOptions,
  ): Promise<void> {
    const manifest = assertManifest(plugin.manifest);
    if (manifest.apiVersion !== API_VERSION) {
      throw new ArgusError(
        'PLUGIN_ERROR',
        `Incompatible apiVersion ${manifest.apiVersion}; host requires ${API_VERSION}`,
      );
    }
    if (this.plugins.has(manifest.id)) {
      throw new ArgusError('PLUGIN_ERROR', `Plugin already registered: ${manifest.id}`);
    }

    const registered: Registered = {
      plugin,
      inFlight: 0,
      state: {
        id: manifest.id,
        name: manifest.name,
        version: manifest.version,
        build: manifest.build,
        enabled: false,
        initialized: false,
        consecutiveFailures: 0,
        disabledReason: null,
        lastError: null,
        repoIndexUrl: opts?.repoIndexUrl ?? null,
      },
    };
    this.plugins.set(manifest.id, registered);

    try {
      const ctx = createHostContext({
        pluginId: manifest.id,
        permissions: manifest.permissions,
      });
      await plugin.initialize(ctx);
      registered.state.initialized = true;
      registered.state.enabled = true;
      this.emit();
    } catch (err) {
      registered.state.lastError = messageOf(err);
      registered.state.enabled = false;
      registered.state.initialized = false;
      this.emit();
      throw err;
    }
  }

  /**
   * Unregister (dispose) a plugin. Used by Fast Refresh and uninstall.
   */
  async unregisterPlugin(id: string): Promise<void> {
    const r = this.plugins.get(id);
    if (!r) return;
    r.state.enabled = false;
    await this.safeDispose(r);
    this.plugins.delete(id);
    this.emit();
  }

  /**
   * Register or replace (dev HMR / reinstall). Same id replaces the old instance.
   */
  async replaceOrRegister(
    plugin: ArgusPlugin,
    opts?: RegisterPluginOptions,
  ): Promise<void> {
    const id = plugin.manifest?.id;
    if (id && this.plugins.has(id)) {
      await this.unregisterPlugin(id);
    }
    await this.registerPlugin(plugin, opts);
  }

  /** Patch origin repo after register (e.g. backfill from store registry). */
  setRepoIndexUrl(id: string, repoIndexUrl: string | null): void {
    const r = this.plugins.get(id);
    if (!r) return;
    if (r.state.repoIndexUrl === repoIndexUrl) return;
    r.state.repoIndexUrl = repoIndexUrl;
    this.emit();
  }

  async enable(id: string): Promise<void> {
    const r = this.require(id);
    if (r.state.enabled) return;
    if (!r.state.initialized) {
      const ctx = createHostContext({
        pluginId: r.plugin.manifest.id,
        permissions: r.plugin.manifest.permissions,
      });
      await r.plugin.initialize(ctx);
      r.state.initialized = true;
    }
    r.state.enabled = true;
    r.state.disabledReason = null;
    r.state.consecutiveFailures = 0;
    this.emit();
  }

  async disable(id: string, reason?: string): Promise<void> {
    const r = this.require(id);
    r.state.enabled = false;
    r.state.disabledReason = reason ?? null;
    this.emit();
    // Best-effort dispose after in-flight drain is not awaited here;
    // dispose runs when inFlight hits 0 on the next settle, or immediately if idle.
    if (r.inFlight === 0) {
      await this.safeDispose(r);
    }
  }

  async toggle(id: string): Promise<void> {
    const r = this.require(id);
    if (r.state.enabled) await this.disable(id);
    else await this.enable(id);
  }

  async search(
    id: string,
    query: string,
    opts: SearchOptions = {},
  ): Promise<MediaItem[]> {
    const items = await this.call(id, 'search', 'search', (plugin, signal) =>
      plugin.search!(query, opts, signal),
    );
    return guardMediaItems(id, items);
  }

  async getHomeRows(id: string): Promise<Row[]> {
    const rows = await this.call(id, 'getHomeRows', 'getHomeRows', (plugin, signal) =>
      plugin.getHomeRows!(signal),
    );
    return guardRows(id, rows);
  }

  async getDetails(id: string, mediaId: MediaId): Promise<MediaDetails> {
    return this.call(id, 'getDetails', 'getDetails', (plugin, signal) =>
      plugin.getDetails!(mediaId, signal),
    );
  }

  async getPlayback(id: string, mediaId: MediaId): Promise<StreamDescriptor> {
    return this.call(id, 'getPlayback', 'getPlayback', (plugin, signal) =>
      plugin.getPlayback!(mediaId, signal),
    );
  }

  async getLive(id: string): Promise<LiveEvent[]> {
    return this.call(id, 'getLive', 'getLive', (plugin, signal) =>
      plugin.getLive!(signal),
    );
  }

  /** Fan-out helper: ids of currently enabled plugins. */
  enabledIds(): string[] {
    return [...this.plugins.values()]
      .filter((r) => r.state.enabled && r.state.initialized)
      .map((r) => r.state.id);
  }

  private require(id: string): Registered {
    const r = this.plugins.get(id);
    if (!r) throw new ArgusError('PLUGIN_ERROR', `Unknown plugin: ${id}`);
    return r;
  }

  private async call<T>(
    id: string,
    method: string,
    timeoutKey: TimeoutKey,
    invoke: (plugin: ArgusPlugin, signal: AbortSignal) => Promise<T>,
  ): Promise<T> {
    const r = this.require(id);
    if (!r.state.enabled || !r.state.initialized) {
      throw new ArgusError('PLUGIN_ERROR', `Plugin ${id} is disabled`);
    }

    if (method === 'getPlayback') {
      const caps = r.plugin.manifest.capabilities;
      if (!caps.includes('vod') && !caps.includes('live')) {
        throw new ArgusError(
          'PLUGIN_ERROR',
          `Plugin ${id} lacks vod/live capability for getPlayback`,
        );
      }
    } else {
      const capability = METHOD_CAPABILITY[method];
      if (capability && !r.plugin.manifest.capabilities.includes(capability)) {
        throw new ArgusError(
          'PLUGIN_ERROR',
          `Plugin ${id} lacks capability ${capability} for ${method}`,
        );
      }
    }

    if (typeof (r.plugin as ArgusPlugin & Record<string, unknown>)[method] !== 'function') {
      throw new ArgusError('PLUGIN_ERROR', `Plugin ${id} missing method ${method}`);
    }

    const timeoutMs = DEFAULT_TIMEOUTS[timeoutKey];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    r.inFlight += 1;
    try {
      const result = await Promise.race([
        invoke(r.plugin, controller.signal),
        rejectAfterAbort(controller.signal, timeoutMs, id, method),
      ]);
      r.state.consecutiveFailures = 0;
      r.state.lastError = null;
      this.emit();
      return result;
    } catch (err) {
      const normalized = normalizeError(err);
      r.state.lastError = normalized.message;

      if (!isExpectedArgusError(normalized)) {
        r.state.consecutiveFailures += 1;
        if (r.state.consecutiveFailures >= BREAKER_THRESHOLD) {
          r.state.enabled = false;
          r.state.disabledReason = `Disabled after ${BREAKER_THRESHOLD} consecutive failures`;
        }
      }
      this.emit();
      throw normalized;
    } finally {
      clearTimeout(timer);
      r.inFlight -= 1;
      if (!r.state.enabled && r.inFlight === 0) {
        await this.safeDispose(r);
      }
    }
  }

  private async safeDispose(r: Registered): Promise<void> {
    try {
      await r.plugin.dispose?.();
    } catch (err) {
      console.warn(`[kernel] dispose failed for ${r.state.id}`, err);
    }
    r.state.initialized = false;
  }
}

function rejectAfterAbort(
  signal: AbortSignal,
  timeoutMs: number,
  pluginId: string,
  method: string,
): Promise<never> {
  return new Promise((_, reject) => {
    if (signal.aborted) {
      reject(
        new ArgusError('PLUGIN_ERROR', `Timeout calling ${pluginId}.${method} after ${timeoutMs}ms`),
      );
      return;
    }
    signal.addEventListener(
      'abort',
      () => {
        reject(
          new ArgusError(
            'PLUGIN_ERROR',
            `Timeout calling ${pluginId}.${method} after ${timeoutMs}ms`,
          ),
        );
      },
      { once: true },
    );
  });
}

function normalizeError(err: unknown): ArgusError {
  if (isArgusError(err)) {
    // Re-wrap duck-typed foreign errors into a host-side ArgusError instance.
    return new ArgusError(err.code, err.message, {
      cause: err,
      retryAfter: err.retryAfter,
      details: err.details,
    });
  }
  return new ArgusError('PLUGIN_ERROR', messageOf(err), { cause: err });
}

function messageOf(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export const pluginKernel = new PluginKernel();

/** @internal test helper */
export function createPluginKernelForTests(): PluginKernel {
  return new PluginKernel();
}

export type { PluginManifest };
