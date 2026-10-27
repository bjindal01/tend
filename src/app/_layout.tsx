import { BricolageGrotesque_600SemiBold, BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, View } from 'react-native';

import { StoreProvider, useStore } from '@/lib/store';
import { colors } from '@/lib/theme';

function Shell() {
  const { ready, refreshNow } = useStore();

  // Keep "days ago" accurate when the app comes back to the foreground.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refreshNow());
    return () => sub.remove();
  }, [refreshNow]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.ground }} />;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ground } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="person/[id]" />
        <Stack.Screen name="log" options={{ presentation: 'modal' }} />
        <Stack.Screen name="person-form" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });
  if (!loaded) return <View style={{ flex: 1, backgroundColor: colors.ground }} />;
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
