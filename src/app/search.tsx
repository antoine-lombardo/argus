import { ThemedText } from '@/presentation/components/themed-text';
import { FocusEntry, Screen } from '@/presentation/components/tv';

export default function SearchScreen() {
  return (
    <Screen>
      <ThemedText type="title">Search</ThemedText>
      <ThemedText themeColor="textSecondary">
        On-screen keyboard + results grid (fixtures) — next.
      </ThemedText>
      <FocusEntry>Start search</FocusEntry>
    </Screen>
  );
}
