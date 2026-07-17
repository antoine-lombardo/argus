import { ThemedText } from '@/presentation/components/themed-text';
import { FocusEntry, Screen } from '@/presentation/components/tv';

export default function LibraryScreen() {
  return (
    <Screen>
      <ThemedText type="title">Library</ThemedText>
      <ThemedText themeColor="textSecondary">
        Favorites and continue watching — next.
      </ThemedText>
      <FocusEntry>Open library</FocusEntry>
    </Screen>
  );
}
