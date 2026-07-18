import { describe, expect, it } from 'vitest';

import { evaluatePluginBundle } from '@/platform/plugins/load-cjs';

describe('evaluatePluginBundle', () => {
  it('loads a minimal CJS default export', () => {
    const code = `
      const plugin = {
        manifest: {
          id: "argus.test",
          name: "Test",
          version: "0.0.1",
          build: 1,
          apiVersion: "0.1",
          entry: "index.js",
          capabilities: ["search"],
          permissions: [],
          platforms: ["tvos"],
        },
        initialize: async () => {},
      };
      module.exports = { default: plugin };
    `;
    const plugin = evaluatePluginBundle(code, 'test');
    expect(plugin.manifest.id).toBe('argus.test');
  });

  it('rejects require() of external modules', () => {
    const code = `
      require("lodash");
      module.exports = { default: {} };
    `;
    expect(() => evaluatePluginBundle(code, 'bad')).toThrow(/require/);
  });
});
