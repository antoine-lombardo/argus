import { ThemedText } from '@/presentation/components/themed-text';
import { Poster, Rail, Screen } from '@/presentation/components/tv';

export default function HomeScreen() {
  return (
    <Screen>
      <ThemedText type="title">Home</ThemedText>
      <ThemedText themeColor="textSecondary">
        Right from the sidebar focuses the first poster.
      </ThemedText>
      <Rail>
        <Poster title="Continue" />
        <Poster title="Popular" />
        <Poster title="Live" />
      </Rail>
    </Screen>
  );
}
