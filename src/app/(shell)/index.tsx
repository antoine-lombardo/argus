import type { MediaItem } from '@argus-tv/plugin-sdk';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { useFocusRestoreStore } from '@/application/stores/focus-restore-store';
import { aggregateHomeRows, mediaIdKey } from '@/domain';
import { bootPlugins } from '@/platform/kernel/boot';
import { ThemedText } from '@/presentation/components/themed-text';
import { Poster, Rail, Screen } from '@/presentation/components/tv';
import { useRestoreFocusKey } from '@/presentation/hooks/use-restore-focus-key';
import { useScreenDimensions } from '@/presentation/hooks/use-screen-dimensions';
import { useTheme } from '@/presentation/hooks/use-theme';
import type { Row } from '@argus-tv/plugin-sdk';

function liveBadge(item: MediaItem): string | undefined {
  if (item.type !== 'liveEvent' || !item.liveInfo) return undefined;
  if (item.liveInfo.status === 'live') return 'LIVE';
  if (item.liveInfo.status === 'upcoming') return 'SOON';
  return undefined;
}

/** Home — rows from enabled plugins via the kernel. */
export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { spacing } = useScreenDimensions();
  const remember = useFocusRestoreStore((s) => s.remember);
  const { shouldRestore, onRestoredFocus } = useRestoreFocusKey();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await bootPlugins();
        const result = await aggregateHomeRows();
        if (cancelled) return;
        setRows(result.rows);
        if (result.errors.length > 0 && result.rows.length === 0) {
          setError(result.errors.map((e) => e.message).join('; '));
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.four, paddingBottom: spacing.five }}
      >
        <ThemedText type="title">Home</ThemedText>
        {loading ? (
          <ActivityIndicator color={theme.tint} />
        ) : error ? (
          <ThemedText themeColor="textSecondary">{error}</ThemedText>
        ) : rows.length === 0 ? (
          <ThemedText themeColor="textSecondary">
            No catalog rows. Enable a plugin in Settings.
          </ThemedText>
        ) : (
          rows.map((row) => (
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
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 0,
  },
});
