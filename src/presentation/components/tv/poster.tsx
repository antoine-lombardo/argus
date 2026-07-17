import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';

import { Focusable } from '@/platform/focus';
import { ThemedText } from '@/presentation/components/themed-text';
import { useScreenDimensions } from '@/presentation/hooks/use-screen-dimensions';
import { useTheme } from '@/presentation/hooks/use-theme';

type PosterProps = {
  title?: string;
  onSelect?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Preferred focus for first item in a rail. */
  hasTVPreferredFocus?: boolean;
};

/**
 * Poster tile shell — focusable placeholder for Phase 2c fixture grids.
 */
export function Poster({
  title = 'Poster',
  onSelect,
  style,
  hasTVPreferredFocus,
}: PosterProps) {
  const theme = useTheme();
  const { spacing, scale } = useScreenDimensions();
  const width = 120 * scale;
  const height = 180 * scale;

  return (
    <Focusable
      onSelect={onSelect}
      hasTVPreferredFocus={hasTVPreferredFocus}
      style={({ focused }) => [
        {
          width,
          height,
          borderRadius: spacing.two,
          backgroundColor: theme.backgroundElement,
          borderWidth: focused ? 3 : 1,
          borderColor: focused ? theme.text : theme.backgroundSelected,
          justifyContent: 'flex-end' as const,
          padding: spacing.two,
        },
        style,
      ]}
    >
      <View>
        <ThemedText type="small" numberOfLines={2}>
          {title}
        </ThemedText>
      </View>
    </Focusable>
  );
}
