import { ThemedText } from '@/presentation/components/themed-text';
import { FocusEntry, Screen } from '@/presentation/components/tv';

export default function SettingsScreen() {
  return (
    <Screen>
      <ThemedText type="title">Settings</ThemedText>
      <ThemedText themeColor="textSecondary">
        Global + per-plugin settings — next.
      </ThemedText>
      <FocusEntry>Open settings</FocusEntry>
    </Screen>
  );
}
