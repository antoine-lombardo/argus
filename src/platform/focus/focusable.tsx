import { forwardRef, type ReactNode } from 'react';
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type View,
  type ViewStyle,
} from 'react-native';

export type FocusableState = {
  pressed: boolean;
  focused?: boolean;
  hovered?: boolean;
};

export type FocusableProps = Omit<PressableProps, 'style' | 'children'> & {
  /** Preferred press handler for TV remote select / click. */
  onSelect?: () => void;
  style?: StyleProp<ViewStyle> | ((state: FocusableState) => StyleProp<ViewStyle>);
  children?: ReactNode | ((state: FocusableState) => ReactNode);
};

function toFocusableState(state: {
  pressed: boolean;
  focused?: boolean;
  hovered?: boolean;
}): FocusableState {
  return {
    pressed: state.pressed,
    focused: state.focused,
    hovered: state.hovered,
  };
}

/**
 * TV-friendly Pressable: `onSelect` aliases `onPress`; style/children receive focused/hovered.
 * @see docs/adr/0004-tv-ui-focus.md
 */
export const Focusable = forwardRef<View, FocusableProps>(function Focusable(
  { onSelect, onPress, style, children, ...rest },
  ref,
) {
  return (
    <Pressable
      ref={ref}
      {...rest}
      onPress={onSelect ?? onPress}
      style={(state) => {
        const next = toFocusableState(state as FocusableState);
        return typeof style === 'function' ? style(next) : style;
      }}
    >
      {(state) => {
        const next = toFocusableState(state as FocusableState);
        return typeof children === 'function' ? children(next) : children;
      }}
    </Pressable>
  );
});
