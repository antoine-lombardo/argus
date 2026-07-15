import type { ConfigContext, ExpoConfig } from 'expo/config';

import pkg from './package.json';

// Static config lives in app.json. This wrapper makes package.json the single
// source of truth for the user-facing app version (bumped by Changesets); EAS
// owns the build number via `autoIncrement` (see eas.json / docs/PACKAGING.md).
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'Argus',
  slug: config.slug ?? 'argus',
  version: pkg.version,
});
