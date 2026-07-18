# Plugin authoring guide

How to write an Argus provider plugin. Official and third-party plugins use the
**same** packaging and install path (Kodi-style repo over HTTPS / GitHub Pages).

## Kodi analogy

| Kodi | Argus |
|------|-------|
| `xbmc*` host APIs | **`HostContext`** injected in `initialize(ctx)` |
| Addon metadata | **`@argus-tv/plugin-sdk`** + `manifest.json` |
| Zip + repo zip mirrors | **`.argus-plugin`** + GitHub Pages `index.json` |

```bash
npm i -D @argus-tv/plugin-sdk@next   # after build field publishes; else local file:
```

## Start from the example

Copy [`argus-plugins/packages/example`](https://github.com/antoine-lombardo/argus-plugins/tree/main/packages/example):

1. Change `id` / `name` in **both** `manifest.json` and `src/index.ts`.
2. `npm install && npm run build` → stamps `version` from `package.json` and
   `build` from `ARGUS_PLUGIN_BUILD` (default `1`) into `dist/manifest.json` +
   `dist/index.js` (single **CJS** bundle).
3. `npm run pack` → `out/<id>-<version>+<build>.argus-plugin` (+ `.sha256`).
4. Publish via a repo index (official: [argus-repo-index](https://github.com/antoine-lombardo/argus-repo-index) on **GitHub Pages**).

The host **never** npm-depends on your plugin. It downloads (or sideloads) the artifact and loads `index.js` through the plugin store — same for official and community plugins.

## Version + build

Identity is `(version, build)` — [ADR 0008](adr/0008-plugin-version-build-channels.md):

- **version** (semver): bump on the `dev` branch when starting a release line.
- **build** (int ≥ 1): CI increments on every experimental publish for that version.

Host update check: higher semver, or same semver with higher build.

## Official publish (automated)

In [`argus-plugins`](https://github.com/antoine-lombardo/argus-plugins):

1. Work on **`dev`**. Bump `package.json` version when starting a line.
2. Push to **`dev`** → CI packs and updates the **experimental** channel.
3. Merge **`dev` → `main`** → CI **promotes** the same `(version, build)` into
   **main** (`index.json`) — same artifact URL, no rebuild.

## Repo channels (host)

- `index.json` is always the **main** channel.
- Extra channels are listed in `channels[]` (repo-defined). Official Argus
  advertises **experimental**.
- Settings: channel picker only if the repo lists extra channels; **disabled
  while Metro HMR** is active (`shouldTryDevHmr()`).

## Local development (hot reload)

Clone repos as siblings:

```text
Git/
  argus/
  argus-plugin-sdk/     # optional local SDK
  argus-plugins/        # required for example HMR
  argus-repo-index/
```

With `argus-plugins` present, Metro watches `packages/example/src` and the host
registers it in `__DEV__` via `@argus-dev/plugin-example` (see `metro.config.js`).
Edits Fast-Refresh through the **same** `registerPlugin` / `replaceOrRegister` path.

**Force prod-like loading while developing** (seed / on-device store, no Metro HMR):

```bash
EXPO_PUBLIC_ARGUS_PLUGIN_LOAD=store npm run start
# or: start:device / ios / android with the same env
```

Or use `npm run start:store` / `ios:store` / `android:store`.

**Production / TestFlight / Play:** `__DEV__` is false, so Metro HMR is never attempted even if `EXPO_PUBLIC_ARGUS_PLUGIN_LOAD=hmr` was set at build time. Release builds only use the plugin store (seed / repo installs).

### Seed sync (host assets)

```bash
cd ../argus-plugins/packages/example && npm run build
cd ../../argus && npm run plugins:sync-seed
```

## Rules of thumb

- Shipping unit: pre-bundled CJS `index.js` + `manifest.json` (with `version` + `build`)
- Bundle pure-JS deps; no native modules in plugins
- Host I/O only via `HostContext`
- Official catalog layout:
  - `index.json` — main channel + `channels[]` directory
  - `channels/experimental.json` — experimental builds
  - `plugins/<id>/<version>/<build>/*.argus-plugin`
