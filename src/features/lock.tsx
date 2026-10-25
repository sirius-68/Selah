/* Passcode lock with fingerprint / face unlock. The passcode is stored only
   as a salted PBKDF2 hash on this device and never synced. */
import React, { useEffect, useReducer, useRef } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as LocalAuth from 'expo-local-authentication';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { pbkdf2Async } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';
import { S, mutate, wipeAll, flush } from '../lib/store';
import { bytesToB64, b64ToBytes, utf8 } from '../lib/util';
import { t } from '../lib/i18n';
import { Btn, Txt } from '../ui/kit';
import { Icon } from '../ui/Icon';
import { Ribbon } from '../ui/Ribbon';
import { toast } from '../ui/overlay';

type Mode = 'unlock' | 'set' | 'confirm' | 'old';
const LK = { mode: null as Mode | null, entry: '', first: '', len: 4, busy: false, hiddenAt: 0, next: null as null | (() => void), erase: 0, msg: '', bad: false, bioOK: false, autoBio: false, suspend: 0 };
const subs = new Set<() => void>();
const paint = () => subs.forEach(f => f());
const LKT: Record<Mode, [string, string]> = { unlock: ['Welcome back', 'Enter your passcode'], set: ['Create a passcode', 'Choose a passcode you’ll remember'], confirm: ['Confirm passcode', 'Enter the same passcode again'], old: ['Current passcode', 'Enter your current passcode'] };
const ITER = 40000;
async function pinHash(pin: string, salt: string) { const h = await pbkdf2Async(sha256, utf8(pin), b64ToBytes(salt), { c: ITER, dkLen: 32, asyncTick: 25 }); return bytesToB64(h); }
async function setPin(pin: string) { const salt = bytesToB64(Crypto.getRandomBytes(16)); const h = await pinHash(pin, salt); mutate(s => { Object.assign(s.lock, { hash: h, salt, algo: 'pbkdf2-native', len: pin.length, fails: 0, until: 0 }); }); }
async function checkPin(pin: string) { if (!S.lock.hash || S.lock.algo !== 'pbkdf2-native') return false; try { return (await pinHash(pin, S.lock.salt)) === S.lock.hash; } catch (e) { return false; } }
const cooldownLeft = () => Math.max(0, (S.lock.until || 0) - Date.now());
const fmtCd = (ms: number) => { const s = Math.ceil(ms / 1000); return s < 60 ? s + ' ' + t('sec') : Math.ceil(s / 60) + ' ' + t('min'); };
LocalAuth.hasHardwareAsync().then(h => h && LocalAuth.isEnrolledAsync()).then(v => { LK.bioOK = !!v; }).catch(() => {});

export const bioAvailable = () => LK.bioOK;
export function lockOpen(mode: Mode, next?: () => void) {
  LK.mode = mode; LK.entry = ''; LK.next = next || null; LK.erase = 0; LK.msg = ''; LK.bad = false;
  if (mode === 'set') LK.len = LK.len || 4; if (mode === 'unlock' || mode === 'old') LK.len = S.lock.len || 4;
  paint();
  if (mode === 'unlock' && S.lock.bio && LK.bioOK && !LK.autoBio) { LK.autoBio = true; setTimeout(bioUnlock, 350); }
}
function lockClose() { LK.mode = null; LK.entry = ''; LK.autoBio = false; paint(); }
export function lockOnStart() { if (S.lock.on && S.lock.hash) lockOpen('unlock'); else if (S.lock.on) mutate(s => { s.lock.on = false; }, { quiet: true }); }
/* pickers (photos, audio) send the app to the background: don't lock for those */
export const suspendLock = () => { LK.suspend = Date.now(); };
export function lockOnResume(st: string) {
  if (!S.lock.on) return;
  if (st === 'background') { LK.hiddenAt = Date.now(); return; }
  if (st !== 'active' || !LK.hiddenAt || LK.mode) return;
  const away = Date.now() - LK.hiddenAt; LK.hiddenAt = 0;
  if (LK.suspend && Date.now() - LK.suspend < 10 * 60e3) { LK.suspend = 0; return; }
  if (away >= (S.lock.after || 0)) lockOpen('unlock');
}
export async function bioRegister() {
  try { const r = await LocalAuth.authenticateAsync({ promptMessage: t('Fingerprint or face unlock'), cancelLabel: t('Cancel') }); if (!r.success) throw 0; mutate(s => { s.lock.bio = 'device'; }); toast('Fingerprint or face unlock is on'); return true; }
  catch (e) { toast('Fingerprint or face unlock isn’t available here'); return false; }
}
async function bioUnlock() {
  if (!S.lock.bio || LK.mode !== 'unlock') return;
  try { const r = await LocalAuth.authenticateAsync({ promptMessage: t('Unlock Selah'), cancelLabel: t('Use passcode'), disableDeviceFallback: true }); if (r.success && LK.mode === 'unlock') { mutate(s => { s.lock.fails = 0; s.lock.until = 0; }, { quiet: true }); lockClose(); } } catch (e) { }
}
const buzz = () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {}); };
async function key(k: string) {
  if (!LK.mode || LK.busy || LK.erase) return;
  if ((LK.mode === 'unlock' || LK.mode === 'old') && cooldownLeft()) return;
  if (k === 'bio') return bioUnlock();
  if (k === 'del') { LK.entry = LK.entry.slice(0, -1); paint(); return; }
  if (LK.entry.length >= LK.len) return;
  Haptics.selectionAsync().catch(() => {});
  LK.entry += k; LK.msg = ''; LK.bad = false; paint();
  if (LK.entry.length < LK.len) return;
  const pin = LK.entry;
  if (LK.mode === 'set') { LK.first = pin; LK.mode = 'confirm'; setTimeout(() => { LK.entry = ''; paint(); }, 140); return; }
  LK.busy = true; paint();
  try {
    if (LK.mode === 'confirm') {
      if (pin !== LK.first) { LK.mode = 'set'; LK.entry = ''; LK.first = ''; LK.msg = t('Those didn’t match. Try again.'); LK.bad = true; buzz(); return; }
      await setPin(pin); mutate(s => { s.lock.on = true; }); lockClose(); toast('Passcode is on'); return;
    }
    const ok = await checkPin(pin);
    if (ok) { mutate(s => { s.lock.fails = 0; s.lock.until = 0; }, { quiet: true }); const n = LK.next, m = LK.mode; lockClose(); if (m === 'old' && n) n(); return; }
    mutate(s => { s.lock.fails = (s.lock.fails || 0) + 1; if (s.lock.fails >= 5) { const steps = [30e3, 60e3, 5 * 60e3, 15 * 60e3, 60 * 60e3]; s.lock.until = Date.now() + steps[Math.min(steps.length - 1, s.lock.fails - 5)]; } }, { quiet: true });
    LK.entry = ''; buzz(); const left = 5 - S.lock.fails;
    LK.msg = cooldownLeft() ? '' : left > 0 && left < 3 ? t('Wrong passcode.') + ' ' + t(left === 1 ? '1 try left before a short wait.' : '{n} tries left before a short wait.').replace('{n}', String(left)) : t('Wrong passcode. Try again.');
    LK.bad = true;
  } finally { LK.busy = false; paint(); }
}

export function LockHost() {
  const [, f] = useReducer(x => x + 1, 0); const ins = useSafeAreaInsets(); const shake = useRef(new Animated.Value(0)).current;
  useEffect(() => { subs.add(f); return () => { subs.delete(f); }; }, []);
  useEffect(() => { if (!LK.mode || !cooldownLeft()) return; const i = setInterval(f, 1000); return () => clearInterval(i); });
  useEffect(() => { if (LK.bad) Animated.sequence([10, -10, 6, -6, 0].map(v => Animated.timing(shake, { toValue: v, duration: 60, useNativeDriver: true }))).start(); }, [LK.bad, LK.msg]);
  const m = LK.mode; if (!m) return null;
  const bg = '#130D1B', ink = '#F4EFF8', muted = '#A99EB7';
  const wrap = (body: React.ReactNode) => <View accessibilityViewIsModal style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 250, backgroundColor: bg, paddingTop: ins.top + 30, paddingBottom: ins.bottom + 20, alignItems: 'center', paddingHorizontal: 24 }}>{body}</View>;
  const mark = <View style={{ width: 72, height: 72, borderRadius: 36, overflow: 'hidden', backgroundColor: '#B6AEFF', marginBottom: 18 }}><Ribbon k="dusk" v={LK.erase ? 3 : 0} size={72} fade={false} style={{ left: 0, top: 0 }} /></View>;
  if (LK.erase) return wrap(<>
    {mark}
    <Txt w={700} size={26} color={ink} center>Forgot your passcode?</Txt>
    <Txt size={15.5} color={muted} center style={{ marginTop: 10, maxWidth: 320 }}>A passcode can’t be recovered. You can erase Selah’s data on this device and start again. This removes your goals, saved verses, journal, prayer sessions, trackers and uploaded sounds.</Txt>
    <View style={{ flexDirection: 'row', gap: 10, marginTop: 26, alignSelf: 'stretch' }}>
      <Btn label="Cancel" style={{ flex: 1 }} onPress={() => { LK.erase = 0; paint(); }} />
      <Btn kind="danger" label={LK.erase === 2 ? 'Tap again to erase everything' : 'Erase and start again'} style={{ flex: 1.3 }} onPress={async () => { if (LK.erase === 1) { LK.erase = 2; paint(); } else { await wipeAll(); await flush(); lockClose(); } }} />
    </View></>);
  const [title, sub] = LKT[m]; const cd = m === 'unlock' || m === 'old' ? cooldownLeft() : 0;
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', m === 'unlock' && S.lock.bio && LK.bioOK ? 'bio' : '', '0', 'del'];
  return wrap(<>
    {mark}
    <Txt w={700} size={26} color={ink} center>{title}</Txt>
    <Txt size={15.5} color={LK.bad ? '#FF8597' : muted} center tr={false} style={{ marginTop: 8, minHeight: 44 }}>{LK.msg || (cd ? t('Too many attempts. Try again in') + ' ' + fmtCd(cd) + '.' : t(sub))}</Txt>
    <Animated.View style={{ flexDirection: 'row', gap: 14, marginVertical: 22, transform: [{ translateX: shake }] }}>
      {Array.from({ length: LK.len }, (_, i) => <View key={i} style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: i < LK.entry.length ? '#F4F01E' : 'transparent', borderWidth: 2, borderColor: i < LK.entry.length ? '#F4F01E' : muted }} />)}
    </Animated.View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 288, justifyContent: 'space-between', rowGap: 14, opacity: cd ? 0.35 : 1 }}>
      {keys.map((k, i) => k === '' ? <View key={i} style={{ width: 80, height: 80 }} /> : (
        <Pressable key={i} accessibilityLabel={k === 'del' ? t('Delete') : k === 'bio' ? t('Fingerprint or face unlock') : k} onPress={() => key(k)} style={({ pressed }) => ({ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: k === 'del' || k === 'bio' ? 'transparent' : pressed ? '#3A2E48' : '#2B2236' })}>
          {k === 'del' ? <Icon name="back" color={ink} size={26} /> : k === 'bio' ? <Icon name="finger" color={ink} size={28} /> : <Txt w={600} size={28} color={ink} tr={false}>{k}</Txt>}
        </Pressable>))}
    </View>
    <View style={{ marginTop: 'auto', gap: 14, alignItems: 'center', paddingTop: 20 }}>
      {m === 'set' ? <Pressable onPress={() => { LK.len = LK.len === 4 ? 6 : 4; LK.entry = ''; paint(); }}><Txt w={600} color="#B6AEFF">{LK.len === 4 ? 'Use a 6-digit passcode' : 'Use a 4-digit passcode'}</Txt></Pressable> : null}
      {m === 'unlock' ? <Pressable onPress={() => { LK.erase = 1; paint(); }}><Txt w={600} color="#B6AEFF">Forgot passcode?</Txt></Pressable> : null}
      {m !== 'unlock' ? <Pressable onPress={lockClose}><Txt w={600} color="#B6AEFF">Cancel</Txt></Pressable> : null}
    </View>
  </>);
}
