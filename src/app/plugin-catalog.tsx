import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useFocusRestoreStore } from '@/application/stores/focus-restore-store';
import { usePluginsStore } from '@/application/stores/plugins-store';
import { useReposStore } from '@/application/stores/repos-store';
import { Focusable } from '@/platform/focus';
import {
  listCatalogEntries,
  type CatalogEntry,
} from '@/platform/repos/catalog';
import { formatRelease } from '@/platform/repos/check-updates';
import { isPluginReleaseNewer } from '@/platform/repos/types';
import { ThemedText } from '@/presentation/components/themed-text';
import { Screen } from '@/presentation/components/tv';
import { useRestoreFocusKey } from '@/presentation/hooks/use-restore-focus-key';
import { useScreenDimensions } from '@/presentation/hooks/use-screen-dimensions';
import { useTheme } from '@/presentation/hooks/use-theme';

function statusLabel(
  entry: CatalogEntry,
  installed: { id: string; version: string; build: number }[],
): string {
  const local = installed.find((p) => p.id === entry.pluginId);
  if (!local) return 'Available';
  if (isPluginReleaseNewer(entry.latest, local)) return 'Update';
  return 'Installed';
}

/**
 * Catalog list from enabled repos. Opens a stack screen for install/update/uninstall
 * (same Back / focus-restore pattern as Detail and plugin settings).
 */
export default function PluginCatalogScreen() {
  const theme = useTheme();
  const { spacing } = useScreenDimensions();
  const router = useRouter();
  const repos = useReposStore((s) => s.repos);
  const installed = usePluginsStore((s) => s.installed);
  const remember = useFocusRestoreStore((s) => s.remember);
  const { shouldRestore, onRestoredFocus } = useRestoreFocusKey();

  const [entries, setEntries] = useState<CatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEntries(await listCatalogEntries(repos));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [repos]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <Screen style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          gap: spacing.three,
          paddingBottom: spacing.five,
        }}
      >
        <Focusable
          hasTVPreferredFocus={!entries.some((e) => shouldRestore(e.pluginId))}
          onSelect={() => router.back()}
          style={({ focused }) => ({
            alignSelf: 'flex-start',
            paddingVertical: spacing.two,
            paddingHorizontal: spacing.three,
            borderRadius: spacing.two,
            borderWidth: 3,
            borderColor: focused ? theme.tint : 'transparent',
            backgroundColor: theme.backgroundElement,
          })}
        >
          <ThemedText type="smallBold">Back</ThemedText>
        </Focusable>

        <View style={{ gap: spacing.one }}>
          <ThemedText type="title">Plugin catalog</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Select a plugin to install, update, or remove.
          </ThemedText>
        </View>

        {loading ? (
          <ThemedText themeColor="textSecondary">Loading catalog…</ThemedText>
        ) : null}
        {error ? (
          <ThemedText themeColor="textSecondary">Failed: {error}</ThemedText>
        ) : null}
        {!loading && !error && entries.length === 0 ? (
          <ThemedText themeColor="textSecondary">
            No plugins in enabled repositories. Enable a repo in Settings.
          </ThemedText>
        ) : null}

        {entries.map((entry) => (
          <Focusable
            key={`${entry.repoIndexUrl}:${entry.pluginId}`}
            hasTVPreferredFocus={shouldRestore(entry.pluginId)}
            onFocus={() => onRestoredFocus(entry.pluginId)}
            onSelect={() => {
              remember(entry.pluginId);
              router.push({
                pathname: '/plugin-catalog-item',
                params: {
                  pluginId: entry.pluginId,
                  repoIndexUrl: entry.repoIndexUrl,
                },
              });
            }}
            style={({ focused }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: spacing.three,
              paddingHorizontal: spacing.four,
              borderRadius: spacing.two,
              borderWidth: 3,
              borderColor: focused ? theme.tint : 'transparent',
              backgroundColor: theme.backgroundElement,
            })}
          >
            <View style={{ flexShrink: 1, paddingRight: spacing.three, gap: spacing.half }}>
              <ThemedText type="smallBold" numberOfLines={1}>
                {entry.name}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {formatRelease(entry.latest)} · {entry.repoName}
              </ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {statusLabel(entry, installed)}
            </ThemedText>
          </Focusable>
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
