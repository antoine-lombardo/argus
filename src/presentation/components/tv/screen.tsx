import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useScreenDimensions } from '@/presentation/hooks/use-screen-dimensions';

type ScreenProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Screen layout only — focus is owned by the shell content FocusGuide. */
export function Screen({ children, style }: ScreenProps) {
  const { spacing } = useScreenDimensions();
  return (
    <View style={[styles.root, { padding: spacing.four, gap: spacing.two }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
