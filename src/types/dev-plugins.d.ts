declare module '@argus-dev/plugin-example' {
  import type { ArgusPlugin } from '@argus-tv/plugin-sdk';
  const plugin: ArgusPlugin;
  export default plugin;
}

declare module '*.txt' {
  const asset: number;
  export default asset;
}

declare module '*.json.txt' {
  const asset: number;
  export default asset;
}
