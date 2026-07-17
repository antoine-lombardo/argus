import type { ComponentProps, ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { FocusGuide } from '@/platform/focus';
import { ThemedText } from '@/presentation/components/themed-text';
import { useScreenDimensions } from '@/presentation/hooks/use-screen-dimensions';

type RailProps = {
  /** Row label above the posters. */
  title?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  autoFocus?: boolean;
  destinations?: ComponentProps<typeof FocusGuide>['destinations'];
};

/**
 * Horizontal focusable media row (home / library rails).
 */
export function Rail({
  title,
  children,
  style,
  autoFocus = false,
  destinations,
}: RailProps) {
  const { spacing } = useScreenDimensions();
  return (
    <View style={[styles.wrap, style]}>
      {title ? (
        <ThemedText type="subtitle" style={{ marginBottom: spacing.one }}>
          {title}
        </ThemedText>
      ) : null}
      <FocusGuide
        autoFocus={autoFocus}
        destinations={destinations}
        style={styles.guide}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: spacing.three,
            paddingVertical: spacing.two,
          }}
        >
          {children}
        </ScrollView>
      </FocusGuide>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  guide: {
    width: '100%',
  },
});
