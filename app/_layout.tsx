import React, { useEffect, useRef, useState } from 'react';
import { Animated, AppState, Easing, Pressable, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useFonts } from 'expo-font';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BricolageGrotesque_300Light, BricolageGrotesque_400Regular, BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold, BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import { Newsreader_400Regular } from '@expo-google-fonts/newsreader';
import { Caveat_500Medium, Caveat_700Bold } from '@expo-google-fonts/caveat';
import { kvLoad, loadState, S, useStore } from '@/lib/store';
import { buildItems, initBible } from '@/lib/bible';
import { useColors } from '@/lib/theme';
import { ColorsCtx, Txt } from '@/ui/kit';
import { Ribbon } from '@/ui/Ribbon';
import { SheetHost, ToastHost, toast } from '@/ui/overlay';
import { AuthFlow } from '@/screens/AuthFlow';
import { LockHost, lockOnResume, lockOnStart } from '@/features/lock';
import { NowPlaying } from '@/features/NowPlaying';
import { bootSync } from '@/lib/sync';
import { bootReminders } from '@/lib/notify';
import { setSoundToast } from '@/lib/sound';
import { registerAccountUI } from '@/features/accountSheets';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function Root() {
  const [fontsOk] = useFonts({
    BricolageGrotesque_300Light, BricolageGrotesque_400Regular, BricolageGrotesque_500Medium,
    BricolageGrotesque_600SemiBold, BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold,
    Newsreader_400Regular, Caveat_500Medium, Caveat_700Bold,
  });
  const [ready, setReady] = useState(false);
  useEffect(() => {
    (async () => {
      await Promise.all([loadState(), kvLoad(['selah.sync', 'selah.sb', 'selah.tracks', 'selah.notif'])]);
      try { await initBible(S.settings.ver); } catch (e) { }
      buildItems();
      setReady(true);
    })();
  }, []);
  if (!fontsOk || !ready) return null;
  return <SafeAreaProvider><App /></SafeAreaProvider>;
}

function App() {
  const S = useStore(); const c = useColors();
  const [splash, setSplash] = useState(true);
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    SystemUI.setBackgroundColorAsync(c.bg).catch(() => {});
    setSoundToast(toast);
    registerAccountUI();
    lockOnStart();
    bootSync(); bootReminders();
    const sub = AppState.addEventListener('change', st => lockOnResume(st));
    return () => sub.remove();
  }, []);
  useEffect(() => { SystemUI.setBackgroundColorAsync(c.bg).catch(() => {}); }, [c.bg]);
  return (
    <ColorsCtx.Provider value={c}>
      <StatusBar style={c.dark ? 'light' : 'dark'} />
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg }, animation: 'slide_from_right' }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="settings" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="paywall" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="card" options={{ animation: 'slide_from_bottom' }} />
        </Stack>
        <NowPlaying />
        {!S.user ? <AuthFlow /> : null}
        <LockHost />
        <SheetHost />
        <ToastHost />
        {splash ? <Splash onDone={() => setSplash(false)} /> : null}
      </View>
    </ColorsCtx.Provider>
  );
}

/* the animated launch screen: ribbon orb, name and tagline */
function Splash({ onDone }: { onDone: () => void }) {
  const ins = useSafeAreaInsets();
  const op = useRef(new Animated.Value(1)).current, pop = useRef(new Animated.Value(0)).current, rise = useRef(new Animated.Value(0)).current;
  const done = useRef(false);
  const finish = () => { if (done.current) return; done.current = true; Animated.timing(op, { toValue: 0, duration: 450, useNativeDriver: true }).start(onDone); };
  useEffect(() => {
    Animated.sequence([
      Animated.timing(pop, { toValue: 1, duration: 700, easing: Easing.bezier(0.2, 0.9, 0.3, 1.25), useNativeDriver: true }),
      Animated.timing(rise, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
    const tm = setTimeout(finish, 2300); return () => clearTimeout(tm);
  }, []);
  return (
    <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#130D1B', opacity: op, zIndex: 300 }}>
      <Pressable accessibilityLabel="Selah is loading" onPress={finish} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <Animated.View style={{ width: 176, height: 176, borderRadius: 88, backgroundColor: '#B6AEFF', overflow: 'hidden', transform: [{ scale: pop }], shadowColor: '#9678FF', shadowOpacity: 0.28, shadowRadius: 40, shadowOffset: { width: 0, height: 30 } }}>
          <Ribbon k="dusk" v={0} size={176} fade={false} style={{ left: 0, top: 0 }} />
        </Animated.View>
        <Animated.View style={{ opacity: rise, transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }], alignItems: 'center' }}>
          <Txt w={700} size={60} lh={1} ls={-0.045} color="#F4EFF8" tr={false}>Selah</Txt>
          <Txt size={16.5} color="#B9AEC6" style={{ marginTop: 12 }}>Pause. Pray. Be still.</Txt>
        </Animated.View>
        <View style={{ position: 'absolute', bottom: 48 + ins.bottom, flexDirection: 'row', gap: 8 }}>
          {['#F4F01E', '#FFB0D4', '#B6AEFF', '#23C25F'].map((col, i) => <Dot key={i} color={col} delay={i * 150} />)}
        </View>
      </Pressable>
    </Animated.View>
  );
}
function Dot({ color, delay }: { color: string; delay: number }) {
  const a = useRef(new Animated.Value(0.3)).current;
  useEffect(() => { const l = Animated.loop(Animated.sequence([Animated.delay(delay), Animated.timing(a, { toValue: 1, duration: 500, useNativeDriver: true }), Animated.timing(a, { toValue: 0.3, duration: 700, useNativeDriver: true })])); l.start(); return () => l.stop(); }, []);
  return <Animated.View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, opacity: a }} />;
}
