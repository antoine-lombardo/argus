import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { usePluginsStore } from '@/application/stores/plugins-store';
import { useReposStore } from '@/application/stores/repos-store';
import { Focusable } from '@/platform/focus';
import { shouldTryDevHmr } from '@/platform/plugins/load-mode';
import {
  listCatalogEntries,
  type CatalogEntry,
} from '@/platform/repos/catalog';
import { formatRelease } from '@/platform/repos/check-updates';
import { isPluginReleaseNewer } from '@/platform/repos/types';
import { SettingsRow } from '@/presentation/components/settings-row';
import { ThemedText } from '@/presentation/components/themed-text';
import { Screen } from '@/presentation/components/tv';
import { useScreenDimensions } from '@/presentation/hooks/use-screen-dimensions';
import { useTheme } from '@/presentation/hooks/use-theme';

/**
 * Catalog plugin detail — install / update / uninstall via stack navigation.
 */
export default function PluginCatalogItemScreen() {
  const theme = useTheme();
  const { spacing } = useScreenDimensions();
  const router = useRouter();
  const hmrActive = shouldTryDevHmr();
  const params = useLocalSearchParams<{
    pluginId?: string;
    repoIndexUrl?: string;
  }>();
  const pluginId = typeof params.pluginId === 'string' ? params.pluginId : '';
  const repoIndexUrl =
    typeof params.repoIndexUrl === 'string' ? params.repoIndexUrl : '';

  const repos = useReposStore((s) => s.repos);
  const installed = usePluginsStore((s) => s.installed);
  const installFromCatalog = usePluginsStore((s) => s.installFromCatalog);
  const uninstall = usePluginsStore((s) => s.uninstall);

  const [entry, setEntry] = useState<CatalogEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const local = installed.find((p) => p.id === pluginId);
  const updateAvailable =
    !!local && !!entry && isPluginReleaseNewer(entry.latest, local);

  const load = useCallback(async () => {
    if (!pluginId) {
      setError('Missing plugin id');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await listCatalogEntries(repos);
      const hit =
        list.find(
          (e) =>
            e.pluginId === pluginId &&
            (!repoIndexUrl || e.repoIndexUrl === repoIndexUrl),
        ) ?? list.find((e) => e.pluginId === pluginId);
      if (!hit) {
        setEntry(null);
        setError('Plugin not found in enabled repositories.');
      } else {
        setEntry(hit);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setEntry(null);
    } finally {
      setLoading(false);
    }
  }, [pluginId, repoIndexUrl, repos]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (action: 'install' | 'update' | 'uninstall') => {
    if (!entry || busy || hmrActive) return;
    setBusy(true);
    setMessage(null);
    try {
      if (action === 'uninstall') {
        await uninstall(entry.pluginId);
        setMessage(`Uninstalled ${entry.name}`);
      } else {
        await installFromCatalog(entry.pluginId, entry.repoIndexUrl);
        setMessage(
          `${action === 'update' ? 'Updated' : 'Installed'} ${entry.name} ${formatRelease(entry.latest)}`,
        );
      }
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          gap: spacing.four,
          paddingBottom: spacing.five,
        }}
      >
        <Focusable
          hasTVPreferredFocus
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

        {loading ? (
          <ThemedText themeColor="textSecondary">Loading…</ThemedText>
        ) : null}
        {error ? (
          <ThemedText themeColor="textSecondary">{error}</ThemedText>
        ) : null}

        {entry ? (
          <>
            <View style={{ gap: spacing.one }}>
              <ThemedText type="title">{entry.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {entry.pluginId}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {entry.repoName} · catalog {formatRelease(entry.latest)}
              </ThemedText>
              {local ? (
                <ThemedText type="small" themeColor="textSecondary">
                  Installed {formatRelease(local)}
                </ThemedText>
              ) : (
                <ThemedText type="small" themeColor="textSecondary">
                  Not installed
                </ThemedText>
              )}
            </View>

            {entry.description ? (
              <ThemedText themeColor="textSecondary">{entry.description}</ThemedText>
            ) : null}

            {message ? (
              <ThemedText type="small" themeColor="textSecondary">
                {message}
              </ThemedText>
            ) : null}

            <View style={{ gap: spacing.two }}>
              <ThemedText type="subtitle">Actions</ThemedText>
              {!local ? (
                <SettingsRow
                  label="Install"
                  value={busy ? '…' : formatRelease(entry.latest)}
                  disabled={busy || hmrActive}
                  onSelect={
                    busy || hmrActive ? undefined : () => void run('install')
                  }
                />
              ) : null}
              {updateAvailable ? (
                <SettingsRow
                  label="Update"
                  value={busy ? '…' : formatRelease(entry.latest)}
                  disabled={busy || hmrActive}
                  onSelect={
                    busy || hmrActive ? undefined : () => void run('update')
                  }
                />
              ) : null}
              {local ? (
                <SettingsRow
                  label="Uninstall"
                  value={busy ? '…' : 'Remove'}
                  disabled={busy || hmrActive}
                  onSelect={
                    busy || hmrActive ? undefined : () => void run('uninstall')
                  }
                />
              ) : null}
              {local && !updateAvailable ? (
                <ThemedText type="small" themeColor="textSecondary">
                  This build is already installed.
                </ThemedText>
              ) : null}
            </View>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 0,
  },
});
