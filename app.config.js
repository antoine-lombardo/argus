/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => ({
  ...config,
  name: config.name ?? 'Argus',
  slug: config.slug ?? 'argus',
  // package.json is the single source of truth for marketing version (Changesets).
  version: require('./package.json').version,
});
