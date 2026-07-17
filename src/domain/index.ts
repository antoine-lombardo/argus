/**
 * Domain layer — provider-agnostic media model and aggregation.
 *
 * Media DTOs live in `@argus-tv/plugin-sdk`. Host fixtures and domain helpers
 * land here until real plugins feed the same shapes.
 */

export { fixtureDetails, getFixtureDetails } from './fixtures/details';
export { fixtureMedia, homeRows } from './fixtures/home-rows';
export {
  libraryContinueWatching,
  libraryFavorites,
  resolveFixtureMedia,
} from './fixtures/library';
export {
  CLEAR_HLS_URL,
  getFixturePlayback,
  playbackLabel,
} from './fixtures/playback';
export { fixturePlugins } from './fixtures/plugins';
export { searchCatalog, searchFixtures } from './fixtures/search';
export { mediaIdKey, parseMediaIdKey } from './media-id';

