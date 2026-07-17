import type { ComponentProps, ReactNode } from 'react';
import { ScrollView, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { FocusGuide } from '@/platform/focus';
import { useScreenDimensions } from '@/presentation/hooks/use-screen-dimensions';

type RailProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  autoFocus?: boolean;
  destinations?: ComponentProps<typeof FocusGuide>['destinations'];
};

/**
 * Horizontal focusable rail shell (structure only — no fixture data yet).
 * Phase 2c will fill with posters / media rows.
 */
export function Rail({ children, style, autoFocus = false, destinations }: RailProps) {
  const { spacing } = useScreenDimensions();
  return (
    <FocusGuide
      autoFocus={autoFocus}
      destinations={destinations}
      style={[styles.guide, style]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.three, paddingVertical: spacing.two }}
      >
        {children}
      </ScrollView>
    </FocusGuide>
  );
}

const styles = StyleSheet.create({
  guide: {
    width: '100%',
  },
});
