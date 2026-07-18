import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { usePluginsStore } from '@/application/stores/plugins-store';
import { useReposStore } from '@/application/stores/repos-store';
import { useSettingsStore } from '@/application/stores/settings-store';
import { bootPlugins } from '@/platform/kernel/boot';
import { shouldTryDevHmr } from '@/platform/plugins/load-mode';
import { isPluginRepoAvailable } from '@/platform/repos/plugin-gate';
import {
  channelDisplayName,
  shouldShowChannelPicker,
} from '@/platform/repos/types';
import { BrandLogo } from '@/presentation/components/brand-logo';
import { SettingsRow } from '@/presentation/components/settings-row';
import { ThemedText } from '@/presentation/components/themed-text';
import { Focusable, Screen } from '@/presentation/components/tv';
import { useScreenDimensions } from '@/presentation/hooks/use-screen-dimensions';
import { useTheme } from '@/presentation/hooks/use-theme';

/**
 * Settings — playback, plugins, repositories.
 * Metro HMR: same UI; catalog / uninstall / updates / repo toggles disabled.
 */
export default function SettingsScreen() {
  const theme = useTheme();
  const { spacing } = useScreenDimensions();
  const router = useRouter();
  const autoplayNext = useSettingsStore((s) => s.autoplayNext);
  const reduceMotion = useSettingsStore((s) => s.reduceMotion);
  const toggleAutoplayNext = useSettingsStore((s) => s.toggleAutoplayNext);
  const toggleReduceMotion = useSettingsStore((s) => s.toggleReduceMotion);
  const installed = usePluginsStore((s) => s.installed);
  const registry = usePluginsStore((s) => s.registry);
  const syncFromKernel = usePluginsStore((s) => s.syncFromKernel);
  const refreshRegistry = usePluginsStore((s) => s.refreshRegistry);
  const repos = useReposStore((s) => s.repos);
  const hydrateRepos = useReposStore((s) => s.hydrate);
  const hmrActive = shouldTryDevHmr();
  const visiblePlugins = installed.filter((p) =>
    isPluginRepoAvailable(p, repos, registry),
  );

  const appVersion =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '0.1.0';

  const refresh = useCallback(async () => {
    await hydrateRepos();
    try {
      await bootPlugins();
    } catch {
      // Boot errors are logged in bootPlugins; still show whatever is registered.
    }
    await refreshRegistry();
    syncFromKernel();
  }, [hydrateRepos, refreshRegistry, syncFromKernel]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <Screen style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.four, paddingBottom: spacing.five }}
      >
        <ThemedText type="title">Settings</ThemedText>

        <View style={{ gap: spacing.two }}>
          <ThemedText type="subtitle">Playback</ThemedText>
          <SettingsRow
            label="Autoplay next episode"
            value={autoplayNext ? 'On' : 'Off'}
            onSelect={toggleAutoplayNext}
          />
          <SettingsRow
            label="Reduce motion"
            value={reduceMotion ? 'On' : 'Off'}
            onSelect={toggleReduceMotion}
          />
        </View>

        <View style={{ gap: spacing.two }}>
          <ThemedText type="subtitle">Plugins</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Open a plugin to enable or remove it. Plugins from disabled
            repositories are hidden.
          </ThemedText>
          {visiblePlugins.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              No plugins installed from enabled repositories.
            </ThemedText>
          ) : (
            visiblePlugins.map((plugin) => (
              <SettingsRow
                key={plugin.id}
                label={`${plugin.name} · ${plugin.version}+${plugin.build}`}
                value={plugin.enabled ? 'On' : 'Off'}
                onSelect={() => {
                  router.push({
                    pathname: '/plugin-settings',
                    params: { pluginId: plugin.id },
                  });
                }}
              />
            ))
          )}
          <Focusable
            disabled={hmrActive}
            onSelect={
              hmrActive
                ? undefined
                : () => {
                    router.push('/plugin-catalog');
                  }
            }
            style={({ focused }) => ({
              alignSelf: 'flex-start',
              paddingVertical: spacing.two,
              paddingHorizontal: spacing.one,
              borderRadius: spacing.one,
              borderWidth: 2,
              borderColor: focused && !hmrActive ? theme.tint : 'transparent',
              opacity: hmrActive ? 0.45 : 1,
            })}
          >
            <ThemedText type="smallBold" themeColor="tint">
              Show more
            </ThemedText>
          </Focusable>
        </View>

        <View style={{ gap: spacing.two }}>
          <ThemedText type="subtitle">Repositories</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Open a repository to enable it and choose a channel.
          </ThemedText>
          {repos.map((repo) => {
            const channel = shouldShowChannelPicker(repo.channels)
              ? channelDisplayName(repo.selectedChannelId, repo.channels)
              : 'Main';
            return (
              <SettingsRow
                key={repo.indexUrl}
                label={repo.name ?? 'Repository'}
                value={repo.enabled ? channel : 'Off'}
                onSelect={() => {
                  router.push({
                    pathname: '/repo-settings',
                    params: { indexUrl: repo.indexUrl },
                  });
                }}
              />
            );
          })}
        </View>

        <View style={{ gap: spacing.two }}>
          <ThemedText type="subtitle">About</ThemedText>
          <View
            style={{
              paddingVertical: spacing.three,
              paddingHorizontal: spacing.four,
              borderRadius: spacing.two,
              backgroundColor: theme.backgroundElement,
              gap: spacing.two,
            }}
          >
            <BrandLogo size={32} showWordmark />
            <ThemedText type="small" themeColor="textSecondary">
              Version {appVersion}
            </ThemedText>
          </View>
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
