import { ThemedText } from '@/presentation/components/themed-text';
import { Collapsible } from '@/presentation/components/ui/collapsible';
import { EventHandlingDemo } from '@/presentation/components/tv-event-demo';
import { Poster, Rail, Screen } from '@/presentation/components/tv';

export default function FocusDemoScreen() {
  return (
    <Screen>
      <ThemedText type="subtitle">TV focus demo</ThemedText>
      <Rail>
        <Poster title="One" />
        <Poster title="Two" />
        <Poster title="Three" />
      </Rail>
      <Collapsible title="How it works">
        <ThemedText>
          Two FocusGuides with autoFocus — Right enters content, Left returns to
          the sidebar row.
        </ThemedText>
      </Collapsible>
      <EventHandlingDemo />
    </Screen>
  );
}
