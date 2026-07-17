import Constants from 'expo-constants';
import { ScrollView, StyleSheet, View } from 'react-native';

import { usePluginsStore } from '@/application/stores/plugins-store';
import { useSettingsStore } from '@/application/stores/settings-store';
import { Focusable } from '@/platform/focus';
import { ThemedText } from '@/presentation/components/themed-text';
import { Screen } from '@/presentation/components/tv';
import { useScreenDimensions } from '@/presentation/hooks/use-screen-dimensions';
import { useTheme } from '@/presentation/hooks/use-theme';

type SettingsRowProps = {
  label: string;
  value: string;
  onSelect: () => void;
};

function SettingsRow({ label, value, onSelect }: SettingsRowProps) {
  const theme = useTheme();
  const { spacing } = useScreenDimensions();

  return (
    <Focusable
      onSelect={onSelect}
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
      <ThemedText type="smallBold">{label}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {value}
      </ThemedText>
    </Focusable>
  );
}

/**
 * Settings — global toggles + per-plugin enable placeholders (fixtures).
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
          <ThemedText type="subtitle">Plugins</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Enable or disable installed plugins. Repo install comes later.
          </ThemedText>
          {installed.map((plugin) => (
            <SettingsRow
              key={plugin.id}
              label={`${plugin.name}${plugin.version ? ` · ${plugin.version}` : ''}`}
              value={plugin.enabled ? 'Enabled' : 'Disabled'}
              onSelect={() => togglePlugin(plugin.id)}
            />
          ))}
        </View>

        <View style={{ gap: spacing.two }}>
          <ThemedText type="subtitle">About</ThemedText>
          <View
            style={{
              paddingVertical: spacing.three,
              paddingHorizontal: spacing.four,
              borderRadius: spacing.two,
              backgroundColor: theme.backgroundElement,
              gap: spacing.one,
            }}
          >
            <ThemedText type="smallBold">Argus</ThemedText>
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
