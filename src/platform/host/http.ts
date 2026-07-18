import type {
  HttpClient,
  HttpRequestOptions,
  HttpResponse,
  Logger,
  Permission,
} from '@argus-tv/plugin-sdk';
import { ArgusError } from '@argus-tv/plugin-sdk';

const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 1;

function headersToRecord(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

function toHttpResponse(res: Response): HttpResponse {
  return {
    status: res.status,
    ok: res.ok,
    headers: headersToRecord(res.headers),
    text: () => res.text(),
    json: <T = unknown>() => res.json() as Promise<T>,
    arrayBuffer: () => res.arrayBuffer(),
  };
}

function isAbortError(err: unknown): boolean {
  return (
    (err instanceof Error && err.name === 'AbortError') ||
    (typeof DOMException !== 'undefined' &&
      err instanceof DOMException &&
      err.name === 'AbortError')
  );
}

function isTransientNetworkError(err: unknown): boolean {
  if (isAbortError(err)) return false;
  if (err instanceof TypeError) return true; // failed to fetch
  return false;
}

export function createHttpClient(
  pluginId: string,
  permissions: readonly Permission[],
  log: Logger,
): HttpClient {
  const allowed = permissions.includes('network');

  return {
    async request(url: string, options: HttpRequestOptions = {}): Promise<HttpResponse> {
      if (!allowed) {
        throw new ArgusError('PLUGIN_ERROR', `Plugin ${pluginId} lacks network permission`);
      }

      const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
      let attempt = 0;

      while (true) {
        const controller = new AbortController();
        const onAbort = () => controller.abort();
        options.signal?.addEventListener('abort', onAbort);

        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
          const res = await fetch(url, {
            method: options.method ?? 'GET',
            headers: options.headers,
            body: options.body as BodyInit | undefined,
            signal: controller.signal,
          });
          return toHttpResponse(res);
        } catch (err) {
          if (isAbortError(err)) {
            if (options.signal?.aborted) {
              throw err;
            }
            throw new ArgusError('PLUGIN_ERROR', `HTTP timeout after ${timeoutMs}ms`, {
              cause: err,
            });
          }
          if (attempt < MAX_RETRIES && isTransientNetworkError(err)) {
            attempt += 1;
            log.warn('http retry', { url, attempt });
            continue;
          }
          throw new ArgusError('PLUGIN_ERROR', 'HTTP request failed', { cause: err });
        } finally {
          clearTimeout(timer);
          options.signal?.removeEventListener('abort', onAbort);
        }
      }
    },
  };
}
