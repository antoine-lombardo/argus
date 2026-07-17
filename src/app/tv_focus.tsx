import { StyleSheet } from 'react-native';

import { ThemedText } from '@/presentation/components/themed-text';
import { ThemedView } from '@/presentation/components/themed-view';
import { Collapsible } from '@/presentation/components/ui/collapsible';
import { EventHandlingDemo } from '@/presentation/components/tv-event-demo';
import { FocusGuide, Poster, Rail } from '@/presentation/components/tv';
import { useScreenDimensions } from '@/presentation/hooks/use-screen-dimensions';
import { useTheme } from '@/presentation/hooks/use-theme';

/**
 * Focus demo route — exercises native TV focus wrappers (ADR 0004).
 */
export default function FocusDemoScreen() {
  const styles = useFocusDemoScreenStyles();
  const theme = useTheme();
  const { spacing } = useScreenDimensions();
  const contentPlatformStyle = {
    paddingTop: spacing.six + spacing.four,
    paddingBottom: spacing.four,
  };

  return (
    <ThemedView
      style={[
        styles.contentContainer,
        contentPlatformStyle,
        { backgroundColor: theme.background },
      ]}
    >
      <FocusGuide autoFocus style={styles.innerContainer}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="subtitle">TV focus demo</ThemedText>
        </ThemedView>
        <ThemedText>
          Native <ThemedText type="code">react-native-tvos</ThemedText> focus
          via host wrappers (ADR 0004). Use the D-pad to move between posters
          and the event demo below.
        </ThemedText>
        <Rail style={{ marginTop: spacing.three }}>
          <Poster title="One" hasTVPreferredFocus />
          <Poster title="Two" />
          <Poster title="Three" />
        </Rail>
        <Collapsible title="How it works" style={{ width: '100%' }}>
          <ThemedText>
            • FocusGuide wraps TVFocusGuideView; Focusable wraps Pressable with
            focused styles.
          </ThemedText>
          <ThemedText>
            • Rail + Poster are presentation shells for Phase 2c rows/grids.
          </ThemedText>
        </Collapsible>
      </FocusGuide>
      <EventHandlingDemo />
    </ThemedView>
  );
}

const useFocusDemoScreenStyles = function () {
  const { width, spacing } = useScreenDimensions();
  const theme = useTheme();
  return StyleSheet.create({
    contentContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background,
      paddingHorizontal: spacing.four,
      paddingTop: spacing.three,
      width,
    },
    innerContainer: {
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      width: width * 0.8,
      gap: spacing.two,
    },
    titleContainer: {
      width: '100%',
      flexDirection: 'row',
      gap: spacing.two,
      justifyContent: 'center',
      marginBottom: spacing.three,
    },
  });
};
