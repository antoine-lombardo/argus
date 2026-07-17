import { useState } from 'react';
import { Dimensions } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useAnimatedIconStyles } from '@/presentation/hooks/use-animated-styles';

const INITIAL_SCALE_FACTOR = Dimensions.get('screen').height / 90;
const DURATION = 600;

const splashKeyframe = new Keyframe({
  0: {
    transform: [{ scale: INITIAL_SCALE_FACTOR }],
    opacity: 1,
  },
  20: {
    opacity: 1,
  },
  70: {
    opacity: 0,
    easing: Easing.elastic(0.7),
  },
  100: {
    opacity: 0,
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

/** Brief brand-colored splash wipe (no Expo assets). */
export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);
  const styles = useAnimatedIconStyles();
  if (!visible) return null;

  return (
    <Animated.View
      entering={splashKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={styles.backgroundSolidColor}
    />
  );
}
