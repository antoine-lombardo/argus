import type { MediaItem } from '@argus-tv/plugin-sdk';
import { ScrollView, StyleSheet } from 'react-native';

import { homeRows } from '@/domain';
import { ThemedText } from '@/presentation/components/themed-text';
import { Poster, Rail, Screen } from '@/presentation/components/tv';
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
  const { spacing } = useScreenDimensions();

  return (
    <Screen style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.four, paddingBottom: spacing.five }}
      >
        <ThemedText type="title">Home</ThemedText>
        {homeRows.map((row) => (
          <Rail key={row.id} title={row.title}>
            {row.items.map((item) => (
              <Poster
                key={`${item.id.pluginId}:${item.id.providerId}`}
                title={item.title}
                imageUrl={item.artwork.poster}
                badge={liveBadge(item)}
              />
            ))}
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
