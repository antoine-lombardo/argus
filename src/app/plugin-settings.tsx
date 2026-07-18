import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { usePluginsStore } from '@/application/stores/plugins-store';
import { useReposStore } from '@/application/stores/repos-store';
import { Focusable } from '@/platform/focus';
import { shouldTryDevHmr } from '@/platform/plugins/load-mode';
import {
  checkPluginUpdates,
  formatRelease,
  type PluginUpdateCheck,
} from '@/platform/repos/check-updates';
import { isPluginRepoAvailable } from '@/platform/repos/plugin-gate';
import { SettingsRow } from '@/presentation/components/settings-row';
import { ThemedText } from '@/presentation/components/themed-text';
import { Screen } from '@/presentation/components/tv';
import { useScreenDimensions } from '@/presentation/hooks/use-screen-dimensions';
import { useTheme } from '@/presentation/hooks/use-theme';

function updateStatusLabel(result: PluginUpdateCheck | null, checking: boolean): string {
  if (checking) return 'Checking…';
  if (!result) return 'Not checked';
  switch (result.status) {
    case 'up-to-date':
      return `Up to date (${formatRelease(result.latest)})`;
    case 'update-available':
      return `Update ${formatRelease(result.latest)}`;
    case 'not-in-catalog':
      return 'Not in catalog';
    case 'no-enabled-repos':
      return 'No repos enabled';
    case 'error':
      return 'Check failed';
    default:
      return 'Unknown';
  }
}

/**
 * Per-plugin settings: enable/disable, updates, uninstall.
 */
export default function PluginSettingsScreen() {
  const theme = useTheme();
  const { spacing } = useScreenDimensions();
  const router = useRouter();
  const params = useLocalSearchParams<{ pluginId?: string }>();
  const pluginId = typeof params.pluginId === 'string' ? params.pluginId : '';

  const plugin = usePluginsStore((s) => s.installed.find((p) => p.id === pluginId));
  const registry = usePluginsStore((s) => s.registry);
  const togglePlugin = usePluginsStore((s) => s.toggle);
  const uninstall = usePluginsStore((s) => s.uninstall);
  const installFromCatalog = usePluginsStore((s) => s.installFromCatalog);
  const repos = useReposStore((s) => s.repos);
  const hmrActive = shouldTryDevHmr();

  const [checking, setChecking] = useState(false);
  const [updateResult, setUpdateResult] = useState<PluginUpdateCheck | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onCheckUpdates = useCallback(async () => {
    if (!plugin || checking) return;
    setChecking(true);
    try {
      const result = await checkPluginUpdates({
        pluginId: plugin.id,
        installed: { version: plugin.version, build: plugin.build },
        repos,
      });
      setUpdateResult(result);
    } finally {
      setChecking(false);
    }
  }, [checking, plugin, repos]);

  const onUninstall = useCallback(async () => {
    if (!plugin || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      await uninstall(plugin.id);
      router.back();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }, [busy, plugin, router, uninstall]);

  const onInstallUpdate = useCallback(async () => {
    if (!plugin || busy || updateResult?.status !== 'update-available') return;
    setBusy(true);
    setMessage(null);
    try {
      await installFromCatalog(plugin.id, updateResult.repoIndexUrl);
      setMessage(`Updated to ${formatRelease(updateResult.latest)}`);
      setUpdateResult(null);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, [busy, installFromCatalog, plugin, updateResult]);

  if (!plugin) {
    return (
      <Screen style={styles.screen}>
        <View style={{ gap: spacing.three, padding: spacing.four }}>
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
          <ThemedText type="title">Plugin not found</ThemedText>
        </View>
      </Screen>
    );
  }

  const repoAvailable = isPluginRepoAvailable(plugin, repos, registry);
  if (!repoAvailable && !hmrActive) {
    return (
      <Screen style={styles.screen}>
        <View style={{ gap: spacing.three, padding: spacing.four }}>
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
          <ThemedText type="title">{plugin.name}</ThemedText>
          <ThemedText themeColor="textSecondary">
            The repository for this plugin is disabled. Re-enable it in Settings
            to use the plugin again.
          </ThemedText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          gap: spacing.four,
          paddingBottom: spacing.five,
          paddingHorizontal: spacing.four,
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

        <View style={{ gap: spacing.one }}>
          <ThemedText type="title">{plugin.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {plugin.id} · {formatRelease({ version: plugin.version, build: plugin.build })}
          </ThemedText>
          {message ? (
            <ThemedText type="small" themeColor="textSecondary">
              {message}
            </ThemedText>
          ) : null}
        </View>

        <View style={{ gap: spacing.two }}>
          <ThemedText type="subtitle">Plugin</ThemedText>
          <SettingsRow
            label="Enabled"
            value={plugin.enabled ? 'On' : 'Off'}
            disabled={busy}
            onSelect={
              busy
                ? undefined
                : () => {
                    void togglePlugin(plugin.id);
                  }
            }
          />
          <SettingsRow
            label="Uninstall"
            value={busy ? '…' : 'Remove'}
            disabled={busy || hmrActive}
            onSelect={
              busy || hmrActive ? undefined : () => void onUninstall()
            }
          />
        </View>

        <View style={{ gap: spacing.two }}>
          <ThemedText type="subtitle">Updates</ThemedText>
          <SettingsRow
            label="Check for updates"
            value={updateStatusLabel(updateResult, checking)}
            disabled={checking || busy || hmrActive}
            onSelect={
              checking || busy || hmrActive
                ? undefined
                : () => void onCheckUpdates()
            }
          />
          {updateResult?.status === 'update-available' && !hmrActive ? (
            <SettingsRow
              label="Install update"
              value={formatRelease(updateResult.latest)}
              disabled={busy}
              onSelect={busy ? undefined : () => void onInstallUpdate()}
            />
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 0,
  },
});
