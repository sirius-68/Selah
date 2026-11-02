import React, { ReactNode, useEffect, useReducer } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IconBtn, Txt, useC } from './kit';
import { Mark } from './Ribbon';
import { Glow } from './overlay';
import { AlertBanner } from '../features/AlertBanner';
import { onAlerts, unread } from '../lib/notify';
import { t } from '../lib/i18n';

/* the bell, with a count of reminders not yet seen */
export function Bell() {
  const [, f] = useReducer(x => x + 1, 0); useEffect(() => onAlerts(f), []);
  const n = unread();
  return (
    <View>
      <IconBtn name="bell" a11y={n ? t('Notifications') + ', ' + n + ' ' + t('new') : 'Notifications'} onPress={() => router.push('/notifications')} />
      {n ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: -2, right: -2, minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10, backgroundColor: '#FF5A7A', alignItems: 'center', justifyContent: 'center' }}>
          <Txt w={700} size={11.5} color="#fff" tr={false} mx={1.2}>{n > 9 ? '9+' : String(n)}</Txt>
        </View>) : null}
    </View>
  );
}

/* the sticky brand bar at the top of each tab: notifications and settings */
export function TopBar() {
  const ins = useSafeAreaInsets();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: ins.top + 12, paddingBottom: 12, paddingHorizontal: 16 }}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Mark size={40} />
        <Txt w={700} size={24} ls={-0.03} tr={false} mx={1.2}>Selah</Txt>
      </View>
      <Bell />
      <IconBtn name="gear" a11y="Settings" onPress={() => router.push('/settings')} />
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
