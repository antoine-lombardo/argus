import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from 'expo-router';
import React from 'react';
import { Platform, useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/presentation/components/animated-icon';
import AppTabs from '@/presentation/components/app-tabs';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {Platform.OS === 'ios' || !Platform.isTV ? (
        <AnimatedSplashOverlay />
      ) : null}
      <AppTabs />
    </ThemeProvider>
  );
}
