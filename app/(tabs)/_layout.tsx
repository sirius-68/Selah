import React from 'react';
import { Pressable, View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useC, Txt, shadow, tap } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { t } from '@/lib/i18n';
import { useStore } from '@/lib/store';

const ITEMS: [string, string, string][] = [['index', 'Today', 'sun'], ['explore', 'Explore', 'compass'], ['goals', 'Goals', 'goals'], ['saved', 'Saved', 'heart'], ['bible', 'Bible', 'book']];

/* the floating pill navigation from the web app, with labels */
function PillBar({ state, navigation }: BottomTabBarProps) {
  const c = useC(); const ins = useSafeAreaInsets(); useStore();
  const cur = state.routes[state.index].name;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 14 + ins.bottom, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', gap: 2, padding: 5, borderRadius: 999, backgroundColor: c.navbg, ...shadow(14, 0.38) }}>
        {ITEMS.map(([name, label, icon]) => {
          const on = cur === name; const fg = on ? c.navactfg : c.navfg;
          return (
            <Pressable key={name} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={t(label)}
              onPress={() => { tap(); const r = state.routes.find(x => x.name === name); if (!r) return; const ev = navigation.emit({ type: 'tabPress', target: r.key, canPreventDefault: true }); if (!on && !ev.defaultPrevented) navigation.navigate(name as never); }}
              style={{ height: 58, minWidth: 58, paddingHorizontal: on ? 10 : 6, borderRadius: 999, alignItems: 'center', justifyContent: 'center', gap: 3, backgroundColor: on ? c.navact : 'transparent' }}>
              <Icon name={icon} size={22} color={fg} />
              <Txt w={600} size={10.5} color={fg} numberOfLines={1}>{label}</Txt>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const c = useC();
  return (
    <Tabs tabBar={p => <PillBar {...p} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: c.bg } } as any}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="goals" />
      <Tabs.Screen name="saved" />
      <Tabs.Screen name="bible" />
    </Tabs>
  );
}
