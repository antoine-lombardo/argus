/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => ({
  ...config,
  name: config.name ?? 'Argus',
  slug: config.slug ?? 'argus',
  // package.json is the single source of truth for marketing version (Changesets).
  version: require('./package.json').version,
  extra: {
    ...(config.extra ?? {}),
    /**
     * Plugin boot mode: `auto` | `hmr` | `store`
     * Override with EXPO_PUBLIC_ARGUS_PLUGIN_LOAD (preferred).
     * Use `store` in a debug client to exercise seed/store loading like production.
     */
    argusPluginLoad: process.env.EXPO_PUBLIC_ARGUS_PLUGIN_LOAD ?? 'auto',
  },
});
