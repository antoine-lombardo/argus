import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useReposStore } from '@/application/stores/repos-store';
import { Focusable } from '@/platform/focus';
import { shouldTryDevHmr } from '@/platform/plugins/load-mode';
import {
  channelDisplayName,
  nextChannelId,
  shouldShowChannelPicker,
} from '@/platform/repos/types';
import { SettingsRow } from '@/presentation/components/settings-row';
import { ThemedText } from '@/presentation/components/themed-text';
import { Screen } from '@/presentation/components/tv';
import { useScreenDimensions } from '@/presentation/hooks/use-screen-dimensions';
import { useTheme } from '@/presentation/hooks/use-theme';

/**
 * Per-repository settings: enable/disable + channel.
 */
export default function RepoSettingsScreen() {
  const theme = useTheme();
  const { spacing } = useScreenDimensions();
  const router = useRouter();
  const params = useLocalSearchParams<{ indexUrl?: string }>();
  const indexUrl = typeof params.indexUrl === 'string' ? params.indexUrl : '';

  const repo = useReposStore((s) => s.repos.find((r) => r.indexUrl === indexUrl));
  const setEnabled = useReposStore((s) => s.setEnabled);
  const setChannel = useReposStore((s) => s.setChannel);

  const hmrActive = shouldTryDevHmr();
  const showChannel = shouldShowChannelPicker(repo?.channels);

  if (!repo) {
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
          <ThemedText type="title">Repository not found</ThemedText>
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
          <ThemedText type="title">{repo.name ?? 'Repository'}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {repo.indexUrl}
          </ThemedText>
        </View>

        <View style={{ gap: spacing.two }}>
          <ThemedText type="subtitle">Repository</ThemedText>
          <SettingsRow
            label="Enabled"
            value={repo.enabled ? 'On' : 'Off'}
            disabled={hmrActive}
            onSelect={
              hmrActive
                ? undefined
                : () => setEnabled(repo.indexUrl, !repo.enabled)
            }
          />
        </View>

        <View style={{ gap: spacing.two }}>
          <ThemedText type="subtitle">Channel</ThemedText>
          {!showChannel ? (
            <SettingsRow label="Channel" value="Main" disabled />
          ) : (
            <SettingsRow
              label="Channel"
              value={channelDisplayName(repo.selectedChannelId, repo.channels)}
              disabled={hmrActive || !repo.enabled}
              onSelect={
                hmrActive || !repo.enabled
                  ? undefined
                  : () =>
                      setChannel(
                        repo.indexUrl,
                        nextChannelId(repo.selectedChannelId, repo.channels),
                      )
              }
            />
          )}
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
