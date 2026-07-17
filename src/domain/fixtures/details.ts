import type { MediaDetails, MediaId, Person } from '@argus-tv/plugin-sdk';

import { fixtureMedia } from '@/domain/fixtures/home-rows';
import { mediaIdKey } from '@/domain/media-id';

const FIXTURE_PLUGIN = 'argus.fixture';

const cast = (...names: string[]): Person[] =>
  names.map((name) => ({ name, role: 'Actor' }));

function backdrop(seed: string): string {
  return `https://picsum.photos/seed/argus-${seed}-bg/1280/720`;
}

/**
 * Full `MediaDetails` for each Home/Search fixture card.
 * Shaped like future `ArgusPlugin.getDetails()` output.
 */
export const fixtureDetails: Record<string, MediaDetails> = {
  [mediaIdKey(fixtureMedia.nebula.id)]: {
    id: fixtureMedia.nebula.id,
    type: 'movie',
    title: fixtureMedia.nebula.title,
    year: 2024,
    runtime: 118,
    artwork: {
      ...fixtureMedia.nebula.artwork,
      backdrop: backdrop('nebula'),
    },
    overview:
      'A deep-space freighter crew chases a signal past the belt and finds a drift that rewrites every map they trust.',
    genres: ['Sci-Fi', 'Adventure'],
    cast: cast('Mira Cole', 'Jonah Voss', 'Elena Park'),
    badges: fixtureMedia.nebula.badges,
  },
  [mediaIdKey(fixtureMedia.harbor.id)]: {
    id: fixtureMedia.harbor.id,
    type: 'movie',
    title: fixtureMedia.harbor.title,
    year: 2023,
    runtime: 104,
    artwork: {
      ...fixtureMedia.harbor.artwork,
      backdrop: backdrop('harbor'),
    },
    overview:
      'One night on the waterfront pulls a detective into a smuggling ring that lights up the entire bay.',
    genres: ['Thriller', 'Crime'],
    cast: cast('Sam Ortega', 'Riley Quinn'),
    badges: fixtureMedia.harbor.badges,
  },
  [mediaIdKey(fixtureMedia.summit.id)]: {
    id: fixtureMedia.summit.id,
    type: 'movie',
    title: fixtureMedia.summit.title,
    year: 2021,
    runtime: 132,
    artwork: {
      ...fixtureMedia.summit.artwork,
      backdrop: backdrop('summit'),
    },
    overview:
      'Diplomats trapped on a remote peak must finish a treaty before the weather — and the assassins — close in.',
    genres: ['Action', 'Drama'],
    cast: cast('Helena Marsh', 'Chris Adeyemi'),
    badges: fixtureMedia.summit.badges,
  },
  [mediaIdKey(fixtureMedia.cedar.id)]: {
    id: fixtureMedia.cedar.id,
    type: 'movie',
    title: fixtureMedia.cedar.title,
    year: 2020,
    runtime: 96,
    artwork: {
      ...fixtureMedia.cedar.artwork,
      backdrop: backdrop('cedar'),
    },
    overview:
      'A family smokehouse becomes the last honest place in a town rewriting its own history.',
    genres: ['Drama'],
    cast: cast('June Harlan', 'Tom Wexler'),
    badges: fixtureMedia.cedar.badges,
  },
  [mediaIdKey(fixtureMedia.quartz.id)]: {
    id: fixtureMedia.quartz.id,
    type: 'series',
    title: fixtureMedia.quartz.title,
    year: 2025,
    artwork: {
      ...fixtureMedia.quartz.artwork,
      backdrop: backdrop('quartz'),
    },
    overview:
      'In a city of glass towers, a fixer sells secrets until one client asks her to bury the truth that built the skyline.',
    genres: ['Crime', 'Drama'],
    cast: cast('Ava Lin', 'Marcus Holt', 'Priya Shah'),
    badges: fixtureMedia.quartz.badges,
    seasons: [
      {
        number: 1,
        title: 'Season 1',
        episodes: [
          {
            id: {
              pluginId: FIXTURE_PLUGIN,
              type: 'episode',
              providerId: 'quartz-s1e1',
            },
            number: 1,
            title: 'Facet',
            overview: 'Ava takes a job that looks routine — until the client vanishes.',
            runtime: 48,
          },
          {
            id: {
              pluginId: FIXTURE_PLUGIN,
              type: 'episode',
              providerId: 'quartz-s1e2',
            },
            number: 2,
            title: 'Refraction',
            overview: 'The skyline starts talking back.',
            runtime: 51,
          },
          {
            id: {
              pluginId: FIXTURE_PLUGIN,
              type: 'episode',
              providerId: 'quartz-s1e3',
            },
            number: 3,
            title: 'Cleavage',
            overview: 'Old debts surface under new glass.',
            runtime: 49,
          },
        ],
      },
    ],
  },
  [mediaIdKey(fixtureMedia.midnight.id)]: {
    id: fixtureMedia.midnight.id,
    type: 'series',
    title: fixtureMedia.midnight.title,
    year: 2022,
    artwork: {
      ...fixtureMedia.midnight.artwork,
      backdrop: backdrop('midnight'),
    },
    overview:
      'Overnight rail crews keep a continent moving — and quietly move things that were never meant to travel.',
    genres: ['Mystery', 'Drama'],
    cast: cast('Dana Crowe', 'Ibrahim Salim'),
    badges: fixtureMedia.midnight.badges,
    seasons: [
      {
        number: 1,
        episodes: [
          {
            id: {
              pluginId: FIXTURE_PLUGIN,
              type: 'episode',
              providerId: 'midnight-s1e1',
            },
            number: 1,
            title: 'Boarding',
            runtime: 44,
          },
          {
            id: {
              pluginId: FIXTURE_PLUGIN,
              type: 'episode',
              providerId: 'midnight-s1e2',
            },
            number: 2,
            title: 'Sidetracked',
            runtime: 46,
          },
        ],
      },
    ],
  },
  [mediaIdKey(fixtureMedia.orchard.id)]: {
    id: fixtureMedia.orchard.id,
    type: 'series',
    title: fixtureMedia.orchard.title,
    year: 2024,
    artwork: {
      ...fixtureMedia.orchard.artwork,
      backdrop: backdrop('orchard'),
    },
    overview:
      'Siblings inherit a failing orchard and the neighbors who will do anything to buy them out.',
    genres: ['Drama', 'Family'],
    cast: cast('Tess Rowan', 'Leo Rowan'),
    badges: fixtureMedia.orchard.badges,
    seasons: [
      {
        number: 1,
        episodes: [
          {
            id: {
              pluginId: FIXTURE_PLUGIN,
              type: 'episode',
              providerId: 'orchard-s1e1',
            },
            number: 1,
            title: 'Rootstock',
            runtime: 42,
          },
        ],
      },
    ],
  },
  [mediaIdKey(fixtureMedia.voltage.id)]: {
    id: fixtureMedia.voltage.id,
    type: 'episode',
    title: 'Voltage — S1E3 · Arc Flash',
    year: 2025,
    runtime: 47,
    artwork: {
      ...fixtureMedia.voltage.artwork,
      backdrop: backdrop('voltage'),
    },
    overview:
      'The grid goes dark downtown. Continue watching as the crew races a cascading failure they may have caused.',
    genres: ['Sci-Fi', 'Thriller'],
    cast: cast('Kai Mercer', 'Nora Blake'),
    badges: fixtureMedia.voltage.badges,
  },
  [mediaIdKey(fixtureMedia.relay.id)]: {
    id: fixtureMedia.relay.id,
    type: 'liveEvent',
    title: fixtureMedia.relay.title,
    artwork: {
      ...fixtureMedia.relay.artwork,
      backdrop: backdrop('relay'),
    },
    overview:
      'Championship final of the Relay Cup. Streams live with delayed highlights when the whistle blows.',
    genres: ['Sports', 'Live'],
    cast: [],
    badges: fixtureMedia.relay.badges,
    liveInfo: {
      status: 'live',
      startsAt: fixtureMedia.relay.liveInfo!.startsAt,
      league: 'Relay Cup',
      home: 'North Circuit',
      away: 'Harbor United',
      channel: 'Fixture Sport 1',
    },
  },
  [mediaIdKey(fixtureMedia.nightowl.id)]: {
    id: fixtureMedia.nightowl.id,
    type: 'liveEvent',
    title: fixtureMedia.nightowl.title,
    artwork: {
      ...fixtureMedia.nightowl.artwork,
      backdrop: backdrop('nightowl'),
    },
    overview:
      'Late-night sessions with rotating hosts. Join when the stream goes live.',
    genres: ['Music', 'Live'],
    cast: cast('DJ Nest'),
    badges: fixtureMedia.nightowl.badges,
    liveInfo: {
      status: 'upcoming',
      startsAt: fixtureMedia.nightowl.liveInfo!.startsAt,
      channel: 'Fixture After Dark',
    },
  },
  [mediaIdKey(fixtureMedia.drmWidevine.id)]: {
    id: fixtureMedia.drmWidevine.id,
    type: 'movie',
    title: fixtureMedia.drmWidevine.title,
    year: 2012,
    runtime: 12,
    artwork: {
      ...fixtureMedia.drmWidevine.artwork,
      backdrop: backdrop('drm-wv'),
    },
    overview:
      'Phase 2b Widevine spike: Google Tears of Steel DASH + Widevine UAT proxy (ExoPlayer demo asset). Play on Android TV / emulator.',
    genres: ['DRM', 'Test'],
    cast: [],
    badges: fixtureMedia.drmWidevine.badges,
  },
  [mediaIdKey(fixtureMedia.drmFairplay.id)]: {
    id: fixtureMedia.drmFairplay.id,
    type: 'movie',
    title: fixtureMedia.drmFairplay.title,
    year: 2026,
    runtime: 1,
    artwork: {
      ...fixtureMedia.drmFairplay.artwork,
      backdrop: backdrop('drm-fp'),
    },
    overview:
      'Phase 2b FairPlay spike: Axinom HLS test vector + evaluation FPS certificate + X-AxDRM-Message token. Play on a physical Apple TV (Simulator cannot FairPlay).',
    genres: ['DRM', 'Test'],
    cast: [],
    badges: fixtureMedia.drmFairplay.badges,
  },
};

/** Look up fixture details by `MediaId` (Phase 2c stand-in for `getDetails`). */
export function getFixtureDetails(id: MediaId): MediaDetails | undefined {
  return fixtureDetails[mediaIdKey(id)];
}
