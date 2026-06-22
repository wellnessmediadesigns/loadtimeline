import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SettingsProvider, useSettings } from '@/store/settings';
import { ThemeProvider, useTheme } from '@/theme/theme';
import { runMigrations, setDemoMode } from '@/db/client';

/** Redirects to onboarding until it has been completed. */
function useOnboardingGate(dbReady: boolean) {
  const { ready, onboardingDone } = useSettings();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready || !dbReady) return;
    const inOnboarding = segments[0] === 'onboarding';
    if (!onboardingDone && !inOnboarding) {
      router.replace('/onboarding');
    } else if (onboardingDone && inOnboarding) {
      router.replace('/');
    }
  }, [ready, dbReady, onboardingDone, segments, router]);
}

function RootNavigator() {
  const t = useTheme();
  const { ready, demoMode } = useSettings();
  const [dbReady, setDbReady] = useState(false);

  // Initialize the datastore once settings are loaded, honoring the persisted
  // demo flag so a relaunch in demo mode stays in demo (and the right DB is
  // active+migrated before any screen queries).
  useEffect(() => {
    if (!ready) return;
    setDemoMode(demoMode);
    runMigrations();
    setDbReady(true);
  }, [ready, demoMode]);

  useOnboardingGate(dbReady);

  if (!ready || !dbReady) {
    return <View style={{ flex: 1, backgroundColor: t.colors.background }} />;
  }

  return (
    <>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: t.colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="loads/[filter]" />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="load/new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="load/[id]/index" />
        <Stack.Screen name="load/[id]/edit" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="load/[id]/incident" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="load/[id]/report" />
        <Stack.Screen name="event/[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="help" />
        <Stack.Screen name="paywall" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SettingsProvider>
          <ThemeProvider>
            <RootNavigator />
          </ThemeProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
