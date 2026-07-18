import type { Logger, LogLevel } from '@argus-tv/plugin-sdk';

export function createLogger(pluginId: string): Logger {
  const prefix = `[plugin:${pluginId}]`;

  const write = (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
    const payload = meta ? `${message} ${JSON.stringify(meta)}` : message;
    switch (level) {
      case 'debug':
        console.debug(prefix, payload);
        break;
      case 'info':
        console.info(prefix, payload);
        break;
      case 'warn':
        console.warn(prefix, payload);
        break;
      case 'error':
        console.error(prefix, payload);
        break;
    }
  };

  return {
    debug: (message, meta) => write('debug', message, meta),
    info: (message, meta) => write('info', message, meta),
    warn: (message, meta) => write('warn', message, meta),
    error: (message, meta) => write('error', message, meta),
  };
}
