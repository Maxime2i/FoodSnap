import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { supabase } from '@/lib/supabase';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SafeAreaView } from 'react-native';
import LoginScreen from './(auth)/login';
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function LayoutContent() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      const inAuthGroup = segments[0] === '(auth)';
      
      if (session && inAuthGroup) {
        // Rediriger vers l'app si connecté et sur une page auth
        router.replace('/(tabs)');
      } else if (!session && !inAuthGroup) {
        // Rediriger vers login si non connecté et pas sur une page auth
        router.replace('/(auth)/login');
      }
    });
  }, [segments, navigationState?.key]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          <Stack.Screen name="meal-detail" options={{ headerShown: false }} />
          <Stack.Screen name="my-meals" options={{ headerShown: false }} />
          <Stack.Screen name="help" options={{ headerShown: false }} />
          <Stack.Screen name="camera" options={{ headerShown: false }} />
          <Stack.Screen name="barcode" options={{ headerShown: false }} />
          <Stack.Screen name="profilEdit" options={{ headerShown: false }} />
          <Stack.Screen name="liked-meals" options={{ headerShown: false }} />
          <Stack.Screen name="food-details" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
        </Stack>
        <StatusBar style="auto" />
      </NavigationThemeProvider>
    </AuthProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LayoutContent />
    </ThemeProvider>
  );
}
