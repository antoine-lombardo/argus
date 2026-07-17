import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from 'expo-router';
import React from 'react';
import { Platform, useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/presentation/components/animated-icon';
import AppShell from '@/presentation/components/app-shell';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {Platform.OS === 'ios' || !Platform.isTV ? (
        <AnimatedSplashOverlay />
      ) : null}
      <AppShell />
    </ThemeProvider>
  );
}
