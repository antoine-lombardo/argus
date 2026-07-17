import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Focusable, FocusGuide } from '@/platform/focus';
import { ThemedText } from '@/presentation/components/themed-text';
import { useScreenDimensions } from '@/presentation/hooks/use-screen-dimensions';
import { useTheme } from '@/presentation/hooks/use-theme';

type SidebarProps = {
  children: ReactNode;
};

/** Sidebar FocusGuide — autoFocus restores the last nav row on Left from content. */
export function Sidebar({ children }: SidebarProps) {
  const theme = useTheme();
  const styles = useStyles();

  return (
    <FocusGuide
      autoFocus
      style={[styles.rail, { backgroundColor: theme.backgroundElement }]}
    >
      <ThemedText type="subtitle" style={styles.brand}>
        Argus
      </ThemedText>
      <View style={styles.items}>{children}</View>
    </FocusGuide>
  );
}

type SidebarItemProps = {
  children: ReactNode;
  isActive?: boolean;
  onFocusNavigate?: () => void;
};

export function SidebarItem({
  children,
  isActive = false,
  onFocusNavigate,
}: SidebarItemProps) {
  const theme = useTheme();
  const styles = useStyles();

  return (
    <Focusable
      onFocus={onFocusNavigate}
      style={({ focused }) => [
        styles.item,
        {
          backgroundColor:
            focused || isActive ? theme.backgroundSelected : 'transparent',
          borderColor: focused ? theme.tint : 'transparent',
        },
      ]}
    >
      {({ focused }) => (
        <ThemedText
          type="smallBold"
          themeColor={focused || isActive ? 'text' : 'textSecondary'}
        >
          {children}
        </ThemedText>
      )}
    </Focusable>
  );
}

const useStyles = () => {
  const { spacing, scale } = useScreenDimensions();
  return StyleSheet.create({
    rail: {
      width: Math.round(160 * scale),
      paddingTop: spacing.four,
      paddingHorizontal: spacing.two,
      paddingBottom: spacing.three,
    },
    brand: {
      marginBottom: spacing.four,
      paddingHorizontal: spacing.two,
    },
    items: {
      gap: spacing.two,
    },
    item: {
      paddingVertical: spacing.two,
      paddingHorizontal: spacing.three,
      borderRadius: spacing.two,
      borderWidth: 2,
    },
  });
};
