import {
  forwardRef,
  type ComponentProps,
  type ReactNode,
  type Ref,
} from 'react';
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

type FocusGuideNativeRef = View & {
  setDestinations: (destinations: NonNullable<FocusGuideProps['destinations']>) => void;
};

/**
 * Thin wrapper around react-native-tvos `TVFocusGuideView`.
 * On web (non-TV), falls back to a plain View.
 * @see docs/adr/0004-tv-ui-focus.md
 */
export const FocusGuide = forwardRef<View, FocusGuideProps>(function FocusGuide(
  props,
  ref,
) {
  if (Platform.OS === 'web') {
    const { children, style } = props as WebFallbackProps;
    return (
      <View ref={ref} style={[styles.web, style]}>
        {children}
      </View>
    );
  }
  return (
    <NativeTVFocusGuideView ref={ref as Ref<FocusGuideNativeRef>} {...props} />
  );
});

const styles = StyleSheet.create({
  web: {
    alignSelf: 'stretch',
  },
});
