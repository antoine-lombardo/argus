/**
 * Temporary until `@argus-tv/plugin-sdk` publishes `build` on PluginManifest.
 * Metro already resolves the local SDK when checked out beside this repo.
 */
import '@argus-tv/plugin-sdk';

declare module '@argus-tv/plugin-sdk' {
  interface PluginManifest {
    /**
     * Monotonic build within `version`. Required by host assertManifest.
     * (Augments published 0.1.x until the SDK release lands.)
     */
    build: number;
  }
}

export {};
