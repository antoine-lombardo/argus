import type { PluginManifest } from '@argus-tv/plugin-sdk';
import { ArgusError } from '@argus-tv/plugin-sdk';

const CAPABILITIES = new Set([
  'search',
  'catalog',
  'vod',
  'live',
  'auth',
  'library',
]);
const PERMISSIONS = new Set(['network', 'secureStorage']);
const PLATFORMS = new Set(['tvos', 'androidtv', 'ios', 'android']);

const ID_RE = /^[a-z0-9]+(\.[a-z0-9-]+)+$/;
const VERSION_RE = /^\d+\.\d+\.\d+/;
const API_VERSION_RE = /^\d+\.\d+$/;

/** Lightweight runtime validation (mirrors `manifestJsonSchema` required shape). */
export function assertManifest(raw: unknown): PluginManifest {
  if (typeof raw !== 'object' || raw === null) {
    throw new ArgusError('PLUGIN_ERROR', 'Invalid manifest: not an object');
  }
  const m = raw as Record<string, unknown>;

  requireString(m, 'id', ID_RE);
  requireString(m, 'name');
  requireString(m, 'version', VERSION_RE);
  requireBuild(m);
  requireString(m, 'apiVersion', API_VERSION_RE);
  requireString(m, 'entry');

  if (!Array.isArray(m.capabilities) || m.capabilities.length === 0) {
    throw new ArgusError('PLUGIN_ERROR', 'Invalid manifest: capabilities');
  }
  for (const c of m.capabilities) {
    if (typeof c !== 'string' || !CAPABILITIES.has(c)) {
      throw new ArgusError('PLUGIN_ERROR', `Invalid capability: ${String(c)}`);
    }
  }

  if (!Array.isArray(m.permissions)) {
    throw new ArgusError('PLUGIN_ERROR', 'Invalid manifest: permissions');
  }
  for (const p of m.permissions) {
    if (typeof p !== 'string' || !PERMISSIONS.has(p)) {
      throw new ArgusError('PLUGIN_ERROR', `Invalid permission: ${String(p)}`);
    }
  }

  if (!Array.isArray(m.platforms) || m.platforms.length === 0) {
    throw new ArgusError('PLUGIN_ERROR', 'Invalid manifest: platforms');
  }
  for (const p of m.platforms) {
    if (typeof p !== 'string' || !PLATFORMS.has(p)) {
      throw new ArgusError('PLUGIN_ERROR', `Invalid platform: ${String(p)}`);
    }
  }

  return m as unknown as PluginManifest;
}

function requireString(
  m: Record<string, unknown>,
  key: string,
  pattern?: RegExp,
): string {
  const v = m[key];
  if (typeof v !== 'string' || v.length === 0) {
    throw new ArgusError('PLUGIN_ERROR', `Invalid manifest: ${key}`);
  }
  if (pattern && !pattern.test(v)) {
    throw new ArgusError('PLUGIN_ERROR', `Invalid manifest: ${key} format`);
  }
  return v;
}

function requireBuild(m: Record<string, unknown>): number {
  const v = m.build;
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1) {
    throw new ArgusError('PLUGIN_ERROR', 'Invalid manifest: build');
  }
  return v;
}
