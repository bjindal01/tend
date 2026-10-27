import { Tabs } from 'expo-router';

import { Icon, type IconName } from '@/components/Icon';
import { colors, fonts } from '@/lib/theme';

const tab = (title: string, icon: IconName) => ({
  title,
  tabBarIcon: ({ color }: { color: unknown }) => <Icon name={icon} size={22} color={typeof color === 'string' ? color : colors.muted} />,
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 12 },
        tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: '#E2E5DF' },
        sceneStyle: { backgroundColor: colors.ground },
      }}
    >
      <Tabs.Screen name="index" options={tab('Today', 'today')} />
      <Tabs.Screen name="people" options={tab('People', 'people')} />
      <Tabs.Screen name="map" options={tab('Map', 'map')} />
      <Tabs.Screen name="rhythm" options={tab('Rhythm', 'rhythm')} />
    </Tabs>
  );
}
