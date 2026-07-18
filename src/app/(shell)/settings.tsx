import Constants from 'expo-constants';
import { ScrollView, StyleSheet, View } from 'react-native';

import { usePluginsStore } from '@/application/stores/plugins-store';
import { useReposStore } from '@/application/stores/repos-store';
import { useSettingsStore } from '@/application/stores/settings-store';
import { Focusable } from '@/platform/focus';
import { shouldTryDevHmr } from '@/platform/plugins/load-mode';
import {
  MAIN_CHANNEL_ID,
  shouldShowChannelPicker,
  type SelectedChannelId,
} from '@/platform/repos/types';
import { BrandLogo } from '@/presentation/components/brand-logo';
import { ThemedText } from '@/presentation/components/themed-text';
import { Screen } from '@/presentation/components/tv';
import { useScreenDimensions } from '@/presentation/hooks/use-screen-dimensions';
import { useTheme } from '@/presentation/hooks/use-theme';

type SettingsRowProps = {
  label: string;
  value: string;
  onSelect?: () => void;
  disabled?: boolean;
};

function SettingsRow({ label, value, onSelect, disabled }: SettingsRowProps) {
  const theme = useTheme();
  const { spacing } = useScreenDimensions();

  return (
    <Focusable
      disabled={disabled || !onSelect}
      onSelect={onSelect ?? (() => {})}
      style={({ focused }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.three,
        paddingHorizontal: spacing.four,
        borderRadius: spacing.two,
        borderWidth: 3,
        borderColor: focused && !disabled ? theme.tint : 'transparent',
        backgroundColor: theme.backgroundElement,
        opacity: disabled ? 0.5 : 1,
      })}
    >
      <ThemedText type="smallBold">{label}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {value}
      </ThemedText>
    </Focusable>
  );
}

function channelLabel(
  selected: SelectedChannelId,
  channels: { id: string; name: string }[] | undefined,
): string {
  if (selected === MAIN_CHANNEL_ID) return 'Main';
  const hit = channels?.find((c) => c.id === selected);
  return hit?.name ?? selected;
}

function cycleChannel(
  selected: SelectedChannelId,
  channels: { id: string; name: string }[] | undefined,
): SelectedChannelId {
  const ids: SelectedChannelId[] = [
    MAIN_CHANNEL_ID,
    ...(channels ?? []).map((c) => c.id),
  ];
  const i = ids.indexOf(selected);
  return ids[(i + 1) % ids.length] ?? MAIN_CHANNEL_ID;
}

/**
 * Settings — global toggles + per-plugin enable (kernel-backed) + repo channel.
 */
export default function SettingsScreen() {
  const theme = useTheme();
  const { spacing } = useScreenDimensions();
  const autoplayNext = useSettingsStore((s) => s.autoplayNext);
  const reduceMotion = useSettingsStore((s) => s.reduceMotion);
  const toggleAutoplayNext = useSettingsStore((s) => s.toggleAutoplayNext);
  const toggleReduceMotion = useSettingsStore((s) => s.toggleReduceMotion);
  const installed = usePluginsStore((s) => s.installed);
  const togglePlugin = usePluginsStore((s) => s.toggle);
  const repos = useReposStore((s) => s.repos);
  const setChannel = useReposStore((s) => s.setChannel);

  const hmrActive = shouldTryDevHmr();
  const appVersion =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '0.1.0';

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
          <ThemedText type="subtitle">Plugin repositories</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Channel picks which catalog index to use for updates. Install from
            repo comes in Phase 4.
          </ThemedText>
          {hmrActive ? (
            <ThemedText type="small" themeColor="textSecondary">
              Hot reload is active — repo channel does not apply. Use
              ios:store / start:store to exercise the store path.
            </ThemedText>
          ) : null}
          {repos.map((repo) => {
            const showPicker = shouldShowChannelPicker(repo.channels);
            if (!showPicker) {
              return (
                <SettingsRow
                  key={repo.indexUrl}
                  label={repo.name ?? repo.indexUrl}
                  value="Main"
                  disabled
                />
              );
            }
            return (
              <SettingsRow
                key={repo.indexUrl}
                label={repo.name ?? 'Repository'}
                value={channelLabel(repo.selectedChannelId, repo.channels)}
                disabled={hmrActive}
                onSelect={
                  hmrActive
                    ? undefined
                    : () =>
                        setChannel(
                          repo.indexUrl,
                          cycleChannel(repo.selectedChannelId, repo.channels),
                        )
                }
              />
            );
          })}
        </View>

        <View style={{ gap: spacing.two }}>
          <ThemedText type="subtitle">Plugins</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Enable or disable installed plugins.
          </ThemedText>
          {installed.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              No plugins registered yet. Open Home to boot the example plugin.
            </ThemedText>
          ) : (
            installed.map((plugin) => (
              <View key={plugin.id} style={{ gap: spacing.one }}>
                <SettingsRow
                  label={`${plugin.name} · ${plugin.version}+${plugin.build}`}
                  value={plugin.enabled ? 'Enabled' : 'Disabled'}
                  onSelect={() => {
                    void togglePlugin(plugin.id);
                  }}
                />
                {plugin.disabledReason ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {plugin.disabledReason}
                  </ThemedText>
                ) : null}
                {plugin.lastError && !plugin.enabled ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    Last error: {plugin.lastError}
                  </ThemedText>
                ) : null}
              </View>
            ))
          )}
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
