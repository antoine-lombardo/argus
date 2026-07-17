import type { MediaItem, Row } from '@argus-tv/plugin-sdk';

const FIXTURE_PLUGIN = 'argus.fixture';

function item(
  partial: Omit<MediaItem, 'id' | 'badges' | 'artwork'> & {
    providerId: string;
    artwork?: MediaItem['artwork'];
    badges?: MediaItem['badges'];
  },
): MediaItem {
  const { providerId, artwork, badges, ...rest } = partial;
  return {
    ...rest,
    id: { pluginId: FIXTURE_PLUGIN, type: rest.type, providerId },
    artwork: artwork ?? {},
    badges: badges ?? [{ pluginId: FIXTURE_PLUGIN, label: 'Fixture' }],
  };
}

/** Sample catalog cards for Phase 2c Home (no real plugin yet). */
export const fixtureMedia = {
  nebula: item({
    providerId: 'nebula',
    type: 'movie',
    title: 'Nebula Drift',
    year: 2024,
    tagline: 'Out beyond the belt',
    artwork: {
      poster: 'https://picsum.photos/seed/argus-nebula/300/450',
    },
  }),
  harbor: item({
    providerId: 'harbor',
    type: 'movie',
    title: 'Harbor Lights',
    year: 2023,
    tagline: 'One night in the bay',
    artwork: {
      poster: 'https://picsum.photos/seed/argus-harbor/300/450',
    },
  }),
  quartz: item({
    providerId: 'quartz',
    type: 'series',
    title: 'Quartz City',
    year: 2025,
    tagline: 'Glass towers, dirty secrets',
    artwork: {
      poster: 'https://picsum.photos/seed/argus-quartz/300/450',
    },
  }),
  midnight: item({
    providerId: 'midnight',
    type: 'series',
    title: 'Midnight Express',
    year: 2022,
    artwork: {
      poster: 'https://picsum.photos/seed/argus-midnight/300/450',
    },
  }),
  summit: item({
    providerId: 'summit',
    type: 'movie',
    title: 'Summit Protocol',
    year: 2021,
    artwork: {
      poster: 'https://picsum.photos/seed/argus-summit/300/450',
    },
  }),
  orchard: item({
    providerId: 'orchard',
    type: 'series',
    title: 'The Orchard',
    year: 2024,
    artwork: {
      poster: 'https://picsum.photos/seed/argus-orchard/300/450',
    },
  }),
  relay: item({
    providerId: 'relay',
    type: 'liveEvent',
    title: 'Relay Cup — Finals',
    tagline: 'Live now',
    artwork: {
      poster: 'https://picsum.photos/seed/argus-relay/300/450',
      thumbnail: 'https://picsum.photos/seed/argus-relay-thumb/480/270',
    },
    liveInfo: {
      status: 'live',
      startsAt: new Date().toISOString(),
      league: 'Relay Cup',
    },
  }),
  nightowl: item({
    providerId: 'nightowl',
    type: 'liveEvent',
    title: 'Night Owl Sessions',
    tagline: 'Starting soon',
    artwork: {
      poster: 'https://picsum.photos/seed/argus-nightowl/300/450',
    },
    liveInfo: {
      status: 'upcoming',
      startsAt: new Date(Date.now() + 3_600_000).toISOString(),
    },
  }),
  cedar: item({
    providerId: 'cedar',
    type: 'movie',
    title: 'Cedar & Smoke',
    year: 2020,
    artwork: {
      poster: 'https://picsum.photos/seed/argus-cedar/300/450',
    },
  }),
  voltage: item({
    providerId: 'voltage',
    type: 'episode',
    title: 'Voltage S1E3',
    year: 2025,
    tagline: 'Continue watching',
    artwork: {
      poster: 'https://picsum.photos/seed/argus-voltage/300/450',
    },
  }),
} as const satisfies Record<string, MediaItem>;

/** Home rows shaped like `ArgusPlugin.getHomeRows()` output. */
export const homeRows: Row[] = [
  {
    id: 'continue',
    title: 'Continue watching',
    items: [fixtureMedia.voltage, fixtureMedia.quartz, fixtureMedia.harbor],
  },
  {
    id: 'popular',
    title: 'Popular now',
    items: [
      fixtureMedia.nebula,
      fixtureMedia.summit,
      fixtureMedia.midnight,
      fixtureMedia.orchard,
      fixtureMedia.cedar,
    ],
  },
  {
    id: 'live',
    title: 'Live & upcoming',
    items: [fixtureMedia.relay, fixtureMedia.nightowl],
  },
];
