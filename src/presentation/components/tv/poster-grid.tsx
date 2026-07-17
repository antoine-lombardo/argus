import type { MediaItem } from '@argus-tv/plugin-sdk';
import { StyleSheet, View } from 'react-native';

import { mediaIdKey } from '@/domain';
import { Poster } from '@/presentation/components/tv/poster';
import { useScreenDimensions } from '@/presentation/hooks/use-screen-dimensions';

type PosterGridProps = {
  items: MediaItem[];
  onSelectItem?: (item: MediaItem) => void;
  /** Media key that should receive preferred focus after Detail → Back. */
  restoreKey?: string | null;
  onRestoredFocus?: (key: string) => void;
};

function liveBadge(item: MediaItem): string | undefined {
  if (item.type !== 'liveEvent' || !item.liveInfo) return undefined;
  if (item.liveInfo.status === 'live') return 'LIVE';
  if (item.liveInfo.status === 'upcoming') return 'SOON';
  return undefined;
}

/** Wrapping poster grid for search results. */
export function PosterGrid({
  items,
  onSelectItem,
  restoreKey,
  onRestoredFocus,
}: PosterGridProps) {
  const { spacing } = useScreenDimensions();

  return (
    <View style={[styles.grid, { gap: spacing.three }]}>
      {items.map((item) => {
        const key = mediaIdKey(item.id);
        return (
          <Poster
            key={`${item.id.pluginId}:${item.id.type}:${item.id.providerId}`}
            title={item.title}
            imageUrl={item.artwork.poster}
            badge={liveBadge(item)}
            hasTVPreferredFocus={restoreKey != null && key === restoreKey}
            onFocus={() => onRestoredFocus?.(key)}
            onSelect={onSelectItem ? () => onSelectItem(item) : undefined}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
  },
});
