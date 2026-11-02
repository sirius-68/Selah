import React, { ReactNode } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IconBtn, Txt, useC } from './kit';
import { Mark } from './Ribbon';
import { Glow, go } from './overlay';
import { openBibleSearch } from '../screens/bibleNav';
import { AlertBanner } from '../features/AlertBanner';

/* the sticky brand bar at the top of each tab */
export function TopBar() {
  const ins = useSafeAreaInsets();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: ins.top + 12, paddingBottom: 12, paddingHorizontal: 16 }}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Mark size={40} />
        <Txt w={700} size={24} ls={-0.03} tr={false}>Selah</Txt>
      </View>
      <IconBtn name="journal" a11y="My journal" onPress={() => go('/journal')} />
      <IconBtn name="search" a11y="Search the Bible" onPress={openBibleSearch} />
      <IconBtn name="sliders" a11y="Settings" onPress={() => router.push('/settings')} />
    </View>
  );
}

export function TabScreen({ children, scrollRef, onRefresh, refreshing }: { children: ReactNode; scrollRef?: any; onRefresh?: () => void; refreshing?: boolean }) {
  const c = useC(); const ins = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Glow />
      <TopBar />
      <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 140 + ins.bottom }}
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={c.muted} /> : undefined}>
        <AlertBanner />
        {children}
      </ScrollView>
    </View>
  );
}
