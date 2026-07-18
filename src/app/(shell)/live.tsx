import type { MediaItem } from '@argus-tv/plugin-sdk';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { useFocusRestoreStore } from '@/application/stores/focus-restore-store';
import { aggregateHomeRows, mediaIdKey } from '@/domain';
import { bootPlugins } from '@/platform/kernel/boot';
import { ThemedText } from '@/presentation/components/themed-text';
import { PosterGrid, Screen } from '@/presentation/components/tv';
import { useRestoreFocusKey } from '@/presentation/hooks/use-restore-focus-key';
import { useTheme } from '@/presentation/hooks/use-theme';

/**
 * Live — liveEvent items from plugin home rows (getLive returns bare LiveEvent
 * without titles; catalog MediaItems are the UI source of truth for now).
 */
export default function LiveScreen() {
  const theme = useTheme();
  const router = useRouter();
  const remember = useFocusRestoreStore((s) => s.remember);
  const { restoreKey, onRestoredFocus } = useRestoreFocusKey();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await bootPlugins();
        const { rows, errors } = await aggregateHomeRows();
        if (cancelled) return;
        const live = rows.flatMap((r) =>
          r.items.filter((i) => i.type === 'liveEvent'),
        );
        setItems(live);
        if (live.length === 0 && errors.length > 0) {
          setError(errors.map((e) => e.message).join('; '));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Screen style={styles.screen}>
      <ThemedText type="title">Live</ThemedText>
      {loading ? (
        <ActivityIndicator color={theme.tint} />
      ) : error ? (
        <ThemedText themeColor="textSecondary">{error}</ThemedText>
      ) : items.length === 0 ? (
        <ThemedText themeColor="textSecondary">No live events right now.</ThemedText>
      ) : (
        <PosterGrid
          items={items}
          restoreKey={restoreKey}
          onRestoredFocus={onRestoredFocus}
          onSelectItem={(item) => {
            remember(mediaIdKey(item.id));
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
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 24,
  },
});
