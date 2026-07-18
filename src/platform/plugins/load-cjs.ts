import type { ArgusPlugin } from '@argus-tv/plugin-sdk';
import { ArgusError } from '@argus-tv/plugin-sdk';

import { assertManifest } from '@/platform/kernel/manifest';

type CjsModule = {
  exports: { default?: ArgusPlugin } & Partial<ArgusPlugin>;
};

/**
 * Evaluate a pre-bundled CJS plugin `index.js` (no Node builtins / bare imports).
 * Same loader Phase 4 will use after downloading a `.argus-plugin` artifact.
 */
export function evaluatePluginBundle(code: string, label: string): ArgusPlugin {
  const moduleObj: CjsModule = { exports: {} };
  const requireStub = (id: string): never => {
    throw new ArgusError(
      'PLUGIN_ERROR',
      `Plugin bundle "${label}" tried to require("${id}") — deps must be bundled`,
    );
  };
  // eslint-disable-next-line no-new-func -- intentional plugin entry (in-process v1)
  const run = new Function(
    'exports',
    'require',
    'module',
    `${code}\n; return module.exports;`,
  ) as (
    exports: CjsModule['exports'],
    require: typeof requireStub,
    module: CjsModule,
  ) => CjsModule['exports'];

  const exported = run(moduleObj.exports, requireStub, moduleObj);
  const plugin =
    exported && typeof exported === 'object' && 'default' in exported && exported.default
      ? exported.default
      : (exported as ArgusPlugin);

  if (!plugin?.manifest || typeof plugin.initialize !== 'function') {
    throw new ArgusError(
      'PLUGIN_ERROR',
      `Invalid plugin module from ${label}: missing default ArgusPlugin export`,
    );
  }
  assertManifest(plugin.manifest);
  return plugin;
}
