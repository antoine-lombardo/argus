import type { ComponentProps, ReactNode } from 'react';
import {
  Platform,
  StyleSheet,
  TVFocusGuideView as NativeTVFocusGuideView,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export type FocusGuideProps = ComponentProps<typeof NativeTVFocusGuideView>;

type WebFallbackProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  autoFocus?: boolean;
  destinations?: FocusGuideProps['destinations'];
};

/**
 * Thin wrapper around react-native-tvos `TVFocusGuideView`.
 * On web (non-TV), falls back to a plain View.
 * @see docs/adr/0004-tv-ui-focus.md
 */
export function FocusGuide(props: FocusGuideProps) {
  if (Platform.OS === 'web') {
    const { children, style } = props as WebFallbackProps;
    return <View style={[styles.web, style]}>{children}</View>;
  }
  return <NativeTVFocusGuideView {...props} />;
}

const styles = StyleSheet.create({
  web: {
    alignSelf: 'stretch',
  },
});
