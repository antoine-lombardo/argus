/**
 * Domain layer — provider-agnostic helpers and aggregation.
 *
 * Media DTOs live in `@argus-tv/plugin-sdk`. Catalog data comes from plugins
 * via the kernel; library seeds remain host-local until Phase 6.
 */

export {
  libraryContinueWatching,
  libraryFavorites,
  resolveFixtureMedia,
  resolveLibraryMedia,
} from './fixtures/library';
export { aggregateHomeRows, aggregateSearch } from './search/aggregate';
export { mediaIdKey, parseMediaIdKey } from './media-id';
