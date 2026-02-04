// ============================================
// CoupleSpace - Root Layout
// ============================================

import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Supabase entegrasyonlu context
import { AppProvider, useApp } from '@/context/AppContextSupabase';

export const unstable_settings = {
  initialRouteName: '(onboarding)',
};

function RootLayoutNav() {
  const { user, couple, isLoading } = useApp();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inOnboarding = segments[0] === '(onboarding)';
    const inTabs = segments[0] === '(tabs)';

    // If user is logged in and has a couple, go to tabs
    if (user && couple) {
      if (inOnboarding) {
        router.replace('/(tabs)');
      }
    } else if (user && !couple) {
      // User logged in but no couple - go to pairing
      if (!inOnboarding || segments[1] !== 'pairing') {
        router.replace('/(onboarding)/pairing');
      }
    } else {
      // No user - go to onboarding
      if (!inOnboarding) {
        router.replace('/(onboarding)');
      }
    }
  }, [user, couple, isLoading, segments]);

  if (isLoading) {
    return null; // Could show a splash screen here
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <RootLayoutNav />
      </AppProvider>
    </SafeAreaProvider>
  );
}
