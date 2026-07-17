import type { MediaItem } from '@argus-tv/plugin-sdk';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { useFocusRestoreStore } from '@/application/stores/focus-restore-store';
import { homeRows, mediaIdKey } from '@/domain';
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

/**
 * Home — fixture rows shaped like future `getHomeRows()` output.
 */
export default function HomeScreen() {
  const router = useRouter();
  const { spacing } = useScreenDimensions();
  const remember = useFocusRestoreStore((s) => s.remember);
  const { shouldRestore, onRestoredFocus } = useRestoreFocusKey();

  return (
    <Screen style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.four, paddingBottom: spacing.five }}
      >
        <ThemedText type="title">Home</ThemedText>
        {homeRows.map((row) => (
          <Rail key={row.id} title={row.title}>
            {row.items.map((item) => {
              const key = mediaIdKey(item.id);
              return (
                <Poster
                  key={`${item.id.pluginId}:${item.id.type}:${item.id.providerId}`}
                  title={item.title}
                  imageUrl={item.artwork.poster}
                  badge={liveBadge(item)}
                  hasTVPreferredFocus={shouldRestore(key)}
                  onFocus={() => onRestoredFocus(key)}
                  onSelect={() => {
                    remember(key);
                    router.push({
                      pathname: '/detail',
                      params: {
                        pluginId: item.id.pluginId,
                        type: item.id.type,
                        providerId: item.id.providerId,
                      },
                    });
                  }}
                />
              );
            })}
          </Rail>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 0,
  },
});
