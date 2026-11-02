/* Global overlays: toast, bottom sheet, and the page scaffolds. */
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleProp, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { router } from 'expo-router';
import { t } from '../lib/i18n';
import { IconBtn, Txt, useC, shadow, tap } from './kit';

/* ---------- toast ---------- */
let toastFn: ((m: string) => void) | null = null;
export function toast(msg: string) { toastFn && toastFn(t(msg)); }
/* already-translated message */
export function toastRaw(msg: string) { toastFn && toastFn(msg); }
export function ToastHost() {
  const c = useC(); const ins = useSafeAreaInsets();
  const [msg, setMsg] = useState(''); const op = useRef(new Animated.Value(0)).current; const tm = useRef<any>(null);
  useEffect(() => { toastFn = (m: string) => { setMsg(m); clearTimeout(tm.current); Animated.timing(op, { toValue: 1, duration: 160, useNativeDriver: true }).start(); tm.current = setTimeout(() => Animated.timing(op, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setMsg('')), 2400); }; return () => { toastFn = null; }; }, [op]);
  if (!msg) return null;
  return (
    <Animated.View pointerEvents="none" accessibilityLiveRegion="polite" style={{ position: 'absolute', left: 0, right: 0, bottom: 92 + ins.bottom, alignItems: 'center', opacity: op, zIndex: 200, transform: [{ translateY: op.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
      <View style={{ backgroundColor: c.pill, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999, maxWidth: '90%', ...shadow(10, 0.3) }}>
        <Txt w={600} size={14.5} color={c.onPill} center tr={false}>{msg}</Txt>
      </View>
    </Animated.View>
  );
}

/* ---------- bottom sheet ---------- */
type SheetOpts = { locked?: boolean; onClose?: () => void; lockedMsg?: string };
let sheetSet: ((s: { node: ReactNode; opts: SheetOpts } | null) => void) | null = null;
let sheetOpen = false;
export function openSheet(node: ReactNode, opts: SheetOpts = {}) { sheetSet && sheetSet({ node, opts }); }
export function closeSheet() { sheetSet && sheetSet(null); }
export const isSheetOpen = () => sheetOpen;
export function SheetHost() {
  const c = useC(); const ins = useSafeAreaInsets();
  const [s, setS] = useState<{ node: ReactNode; opts: SheetOpts } | null>(null);
  const prev = useRef<typeof s>(null);
  useEffect(() => { sheetSet = (x) => { if (!x && prev.current && prev.current.opts.onClose) { const f = prev.current.opts.onClose; setTimeout(f, 0); } prev.current = x; sheetOpen = !!x; setS(x); }; return () => { sheetSet = null; }; }, []);
  const tryClose = () => { if (s && s.opts.locked) { toast(s.opts.lockedMsg || 'Tap Done, or Skip for now, to continue'); return; } closeSheet(); };
  return (
    <Modal visible={!!s} transparent animationType="slide" statusBarTranslucent onRequestClose={tryClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable accessibilityLabel={t('Close')} onPress={tryClose} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(10,5,20,0.6)' }} />
        <View style={{ maxHeight: '92%', backgroundColor: c.surface, borderTopLeftRadius: 34, borderTopRightRadius: 34, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
          <View style={{ width: 42, height: 5, borderRadius: 5, backgroundColor: c.line, alignSelf: 'center', marginTop: 10, marginBottom: 16 }} />
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 + ins.bottom }}>
            {s ? s.node : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
export function SheetTitle({ children, style }: { children: string; style?: any }) { return <Txt w={700} size={28} lh={1.1} ls={-0.03} style={[{ marginBottom: 18 }, style]}>{children}</Txt>; }

/* ---------- page background (radial glow like the web body) ---------- */
export function Glow({ color }: { color?: string }) {
  const c = useC();
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 520 }}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs><RadialGradient id="glow" cx="85" cy="-8" rx="110" ry="50" gradientUnits="userSpaceOnUse"><Stop offset="0" stopColor={color || c.bg2} stopOpacity={1} /><Stop offset="0.62" stopColor={color || c.bg2} stopOpacity={0} /></RadialGradient></Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#glow)" />
      </Svg>
    </View>
  );
}

/* ---------- full-screen feature page with a sticky top bar ---------- */
export function Page({ title, back = true, onBack, right, children, dark, scroll = true, pad = true, bottom = 40, scrollRef, bg }: { title?: string; back?: boolean; onBack?: () => void; right?: ReactNode; children: ReactNode; dark?: boolean; scroll?: boolean; pad?: boolean; bottom?: number; scrollRef?: any; bg?: string }) {
  const c = useC(); const ins = useSafeAreaInsets();
  const goBack = () => { if (onBack) onBack(); else if (router.canGoBack()) router.back(); else router.replace('/'); };
  useEffect(() => { if (!onBack) return; const sub = BackHandler.addEventListener('hardwareBackPress', () => { onBack(); return true; }); return () => sub.remove(); }, [onBack]);
  const top = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: ins.top + 12, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: bg || c.bg }}>
      <IconBtn name={back ? 'chevl' : 'x'} a11y={back ? 'Back' : 'Close'} onPress={goBack} />
      <Txt w={700} size={22} ls={-0.02} style={{ flex: 1 }} numberOfLines={1}>{title || ''}</Txt>
      {right}
    </View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: bg || c.bg }}>
      {top}
      {scroll ? (
        <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: pad ? 16 : 0, paddingBottom: bottom + ins.bottom }}>{children}</ScrollView>
      ) : <View style={{ flex: 1, paddingHorizontal: pad ? 16 : 0 }}>{children}</View>}
    </View>
  );
}
export function useBack(fn: () => boolean) { useEffect(() => { const sub = BackHandler.addEventListener('hardwareBackPress', fn); return () => sub.remove(); }, [fn]); }
export const go = (path: string, params?: Record<string, any>) => { tap(); router.push({ pathname: path as any, params }); };
export function Row({ children, style, gap = 10 }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) { return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>; }
