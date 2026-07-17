import type { MediaItem } from '@argus-tv/plugin-sdk';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { useFocusRestoreStore } from '@/application/stores/focus-restore-store';
import { useLibraryStore } from '@/application/stores/library-store';
import { mediaIdKey, resolveFixtureMedia } from '@/domain';
import { ThemedText } from '@/presentation/components/themed-text';
import { Poster, Rail, Screen } from '@/presentation/components/tv';
import { useRestoreFocusKey } from '@/presentation/hooks/use-restore-focus-key';
import { useScreenDimensions } from '@/presentation/hooks/use-screen-dimensions';

function liveBadge(item: MediaItem): string | undefined {
  if (item.type !== 'liveEvent' || !item.liveInfo) return undefined;
  if (item.liveInfo.status === 'live') return 'LIVE';
  if (item.liveInfo.status === 'upcoming') return 'SOON';
  return undefined;
}

function resolveRow(
  refs: { id: string }[],
): { key: string; item: MediaItem }[] {
  return refs.flatMap((ref) => {
    const item = resolveFixtureMedia(ref.id);
    return item ? [{ key: ref.id, item }] : [];
  });
}

/**
 * Library — continue watching + favorites from the local library store (fixtures).
 */
export default function LibraryScreen() {
  const router = useRouter();
  const { spacing } = useScreenDimensions();
  const remember = useFocusRestoreStore((s) => s.remember);
  const { shouldRestore, onRestoredFocus } = useRestoreFocusKey();
  const continueWatching = useLibraryStore((s) => s.continueWatching);
  const favorites = useLibraryStore((s) => s.favorites);

  const continueItems = resolveRow(continueWatching);
  const favoriteItems = resolveRow(favorites);

  const openDetail = (item: MediaItem) => {
    const key = mediaIdKey(item.id);
    remember(key);
    router.push({
      pathname: '/detail',
      params: {
        pluginId: item.id.pluginId,
        type: item.id.type,
        providerId: item.id.providerId,
      },
    });
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.four, paddingBottom: spacing.five }}
      >
        <ThemedText type="title">Library</ThemedText>
        <ThemedText themeColor="textSecondary">
          Saved on this device — plugins can sync later.
        </ThemedText>

        <Rail title="Continue watching">
          {continueItems.length === 0 ? (
            <ThemedText themeColor="textSecondary">Nothing in progress</ThemedText>
          ) : (
            continueItems.map(({ key, item }) => (
              <Poster
                key={key}
                title={item.title}
                imageUrl={item.artwork.poster}
                badge={liveBadge(item)}
                // Only when returning from Detail — never steal from sidenav.
                hasTVPreferredFocus={shouldRestore(key)}
                onFocus={() => onRestoredFocus(key)}
                onSelect={() => openDetail(item)}
              />
            ))
          )}
        </Rail>

        <Rail title="Favorites">
          {favoriteItems.length === 0 ? (
            <ThemedText themeColor="textSecondary">No favorites yet</ThemedText>
          ) : (
            favoriteItems.map(({ key, item }) => (
              <Poster
                key={key}
                title={item.title}
                imageUrl={item.artwork.poster}
                badge={liveBadge(item)}
                hasTVPreferredFocus={shouldRestore(key)}
                onFocus={() => onRestoredFocus(key)}
                onSelect={() => openDetail(item)}
              />
            ))
          )}
        </Rail>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 0,
  },
});
