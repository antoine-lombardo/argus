const fs = require('fs');
const path = require('path');

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const exampleSrc = path.resolve(__dirname, '../argus-plugins/packages/example/src');
const exampleRoot = path.resolve(__dirname, '../argus-plugins/packages/example');
const sdkRoot = path.resolve(__dirname, '../argus-plugin-sdk');
const sdkEntry = path.join(sdkRoot, 'src');

config.watchFolders = [...(config.watchFolders ?? [])];
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
};

// Dev HMR: watch sibling example when checked out next to this repo.
if (fs.existsSync(exampleSrc)) {
  config.watchFolders.push(exampleRoot);
  config.resolver.extraNodeModules['@argus-dev/plugin-example'] = exampleSrc;
}

// Prefer local SDK source when iterating on unpublished contract changes.
if (fs.existsSync(path.join(sdkRoot, 'package.json'))) {
  config.watchFolders.push(sdkRoot);
  config.resolver.extraNodeModules['@argus-tv/plugin-sdk'] = fs.existsSync(sdkEntry)
    ? sdkEntry
    : sdkRoot;
}

/**
 * Sibling TS packages use ESM-style `./foo.js` imports that map to `foo.ts`.
 * Remap those relative imports when the `.ts` file exists on disk.
 */
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    typeof moduleName === 'string' &&
    moduleName.startsWith('.') &&
    moduleName.endsWith('.js') &&
    context.originModulePath
  ) {
    const asTs = path.resolve(
      path.dirname(context.originModulePath),
      moduleName.replace(/\.js$/, '.ts'),
    );
    if (fs.existsSync(asTs)) {
      return { type: 'sourceFile', filePath: asTs };
    }
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Seed plugin bundle is stored as .txt so Metro treats it as an asset, not JS.
config.resolver.assetExts = [...new Set([...(config.resolver.assetExts ?? []), 'txt'])];

module.exports = config;
