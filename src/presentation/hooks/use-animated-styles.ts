import { StyleSheet } from 'react-native';

export const useAnimatedIconStyles = () => {
  return StyleSheet.create({
    backgroundSolidColor: {
      ...StyleSheet.absoluteFill,
      backgroundColor: '#E8E2D8',
      zIndex: 1000,
    },
  });
};
