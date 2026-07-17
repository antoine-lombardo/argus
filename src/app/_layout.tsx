import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
} from 'expo-router';
import React from 'react';
import { Platform, useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/presentation/components/animated-icon';
import { useTheme } from '@/presentation/hooks/use-theme';

/**
 * Root stack: shell (sidebar + tabs) stays mounted under full-screen routes
 * like Detail / Player, so Back reveals the previous screen in place.
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = useTheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {Platform.OS === 'ios' || !Platform.isTV ? (
        <AnimatedSplashOverlay />
      ) : null}
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: {
            flex: 1,
            backgroundColor: theme.background,
          },
        }}
      >
        <Stack.Screen name="(shell)" />
        <Stack.Screen name="detail" />
        <Stack.Screen name="player" />
      </Stack>
    </ThemeProvider>
  );
}
