import type { ReactNode } from 'react';

import { Focusable } from '@/platform/focus';
import { ThemedText } from '@/presentation/components/themed-text';
import { useScreenDimensions } from '@/presentation/hooks/use-screen-dimensions';
import { useTheme } from '@/presentation/hooks/use-theme';

type FocusEntryProps = {
  children: ReactNode;
};

/** Top-left focusable for placeholder screens (first child the content guide finds). */
export function FocusEntry({ children }: FocusEntryProps) {
  const theme = useTheme();
  const { spacing } = useScreenDimensions();

  return (
    <Focusable
      style={({ focused }) => [
        {
          alignSelf: 'flex-start',
          paddingVertical: spacing.three,
          paddingHorizontal: spacing.four,
          borderRadius: spacing.two,
          backgroundColor: theme.backgroundElement,
          borderWidth: 3,
          borderColor: focused ? theme.tint : 'transparent',
        },
      ]}
    >
      <ThemedText type="smallBold">{children}</ThemedText>
    </Focusable>
  );
}
