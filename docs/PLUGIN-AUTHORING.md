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
npm i -D @argus-tv/plugin-sdk@next   # third-party / no sibling checkout
# Official local layout: file:../argus-plugin-sdk (host) / file:../../../argus-plugin-sdk (example)
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

Clone repos as **siblings** (required for the host `file:` SDK dep and example HMR):

```text
Git/
  argus/                 # host — depends on file:../argus-plugin-sdk
  argus-plugin-sdk/      # required locally (Metro watches src/ for HMR)
  argus-plugins/         # required for example HMR
  argus-repo-index/
  my-private-plugins/    # optional — your other plugin repos (gitignored from argus)
```

```bash
# one-time
cd argus && npm install
cd ../argus-plugins/packages/example && npm install
```

- **SDK:** host `package.json` uses `file:../argus-plugin-sdk`. Metro resolves
  `@argus-tv/plugin-sdk` to **SDK `src/`** and watches it — edit the contract
  without publishing to npm. TypeScript paths point at the same sources.
- **HMR plugins (required for `Run`):** copy
  [`dev-plugins.local.json.example`](../dev-plugins.local.json.example) →
  **`dev-plugins.local.json`** (gitignored). **Nothing is hard-coded** — without
  this file, Metro HMR loads zero plugins (store mode / seed still works via
  **Run (plugin store)**). List every package you want hot-reloaded, including
  the official example if you want it. `metroName` can be any module id; `root`
  is relative to the `argus` repo. Restart Metro after edits.

```json
{
  "plugins": [
    {
      "metroName": "@argus-dev/plugin-example",
      "root": "../argus-plugins/packages/example",
      "src": "src"
    },
    {
      "metroName": "@acme/my-provider",
      "root": "../my-private-plugins/packages/my-provider",
      "src": "src"
    }
  ]
}
```

Each package should export a default `ArgusPlugin` from `src/index.ts` (same
shape as the official example). Edits Fast-Refresh through
`replaceOrRegister`. The example package uses `file:../../../argus-plugin-sdk`.

**Force prod-like loading while developing** (seed / on-device store, no Metro HMR):

```bash
EXPO_PUBLIC_ARGUS_PLUGIN_LOAD=store npm run start
# or: start:device / ios / android with the same env
```

Or use `npm run start:store` / `ios:store` / `android:store`.

**VS Code / Cursor tasks:** **Run** (Metro HMR for whatever is listed in
`dev-plugins.local.json`) and **Run (plugin store)** (seed/on-device store).
Both launch Apple TV + Android TV. Debug launch configs match those names.

**While Metro HMR is active (`Run`):** Settings looks the same. You can
enable/disable plugins; **Show more**, uninstall, updates, and repo
enable/channel stay visible but disabled. Use **Run (plugin store)** for
install flows.

**Settings → Plugins:** **Show more** opens the catalog; selecting a plugin
pushes a detail screen (install / update / uninstall). Open an installed
plugin for enable/disable.
**Settings → Repositories:** enable/disable a repo and choose a channel.

Third-party authors (no sibling layout) still install the published package:

```bash
npm i -D @argus-tv/plugin-sdk@next
```

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
