/**
 * Host-side error helpers. Prefer these over SDK `isArgusError` until the
 * published SDK duck-types across plugin bundle boundaries (local SDK already does).
 */
import { ArgusError, type ArgusErrorCode } from '@argus-tv/plugin-sdk';

const CODES: ReadonlySet<string> = new Set([
  'AUTH_REQUIRED',
  'GEO_BLOCKED',
  'NOT_AVAILABLE',
  'DRM_UNSUPPORTED',
  'RATE_LIMITED',
  'PLUGIN_ERROR',
]);

const EXPECTED: ReadonlySet<ArgusErrorCode> = new Set([
  'AUTH_REQUIRED',
  'GEO_BLOCKED',
  'NOT_AVAILABLE',
  'RATE_LIMITED',
  'DRM_UNSUPPORTED',
]);

export function isArgusError(value: unknown): value is ArgusError {
  if (value instanceof ArgusError) return true;
  if (typeof value !== 'object' || value === null) return false;
  const err = value as { name?: unknown; code?: unknown };
  return (
    err.name === 'ArgusError' &&
    typeof err.code === 'string' &&
    CODES.has(err.code)
  );
}

export function isExpectedArgusError(value: unknown): boolean {
  return isArgusError(value) && EXPECTED.has(value.code);
}
