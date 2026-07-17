/** Placeholder installed plugins until repo install lands. */
export type FixturePlugin = {
  id: string;
  name: string;
  enabled: boolean;
  version?: string;
};

export const fixturePlugins: FixturePlugin[] = [
  {
    id: 'argus.fixture',
    name: 'Argus Fixtures',
    enabled: true,
    version: '0.1.0',
  },
  {
    id: 'argus.demo-vod',
    name: 'Demo VOD',
    enabled: true,
    version: '0.0.1',
  },
  {
    id: 'argus.demo-sports',
    name: 'Demo Sports',
    enabled: false,
    version: '0.0.1',
  },
];
