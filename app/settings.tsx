import React, { useEffect, useReducer, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { useStore, mutate } from '@/lib/store';
import { CT, CT_KEYS, LANGS, PLANS, VERS } from '@/lib/content';
import { t } from '@/lib/i18n';
import { setLang, setVersion } from '@/lib/lang';
import { SB, SB_ON, SY, onSync, syLabel, syMetaGet, syNow, e2eOff, sbErr } from '@/lib/sync';
import { notifState, onAlerts, refreshPerm, unread } from '@/lib/notify';
import { Page, toast, toastRaw } from '@/ui/overlay';
import { Btn, Chip, Chips, Field, SetRow, Seg, Switch, Txt, useC, tap } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { openDeleteAccount, openE2E, openSignOut, openUnlock } from '@/features/accountSheets';
import { bioAvailable, bioRegister, lockOpen } from '@/features/lock';

export default function Settings() {
  const S = useStore(); const c = useC(); const s = S.settings, lk = S.lock;
  const [, f] = useReducer(x => x + 1, 0); useEffect(() => { refreshPerm(); const a = onSync(f), b = onAlerts(f); return () => { a(); b(); }; }, []);
  const u = S.user, nm = u && (u.name || u.email || (u.provider + ' account'));
  const ns = notifState(); const M = syMetaGet(); const signedIn = !!(u && SB.sess);
  const nCount = unread();
  return (
    <Page title="Settings" back={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 24, backgroundColor: c.surface2, marginBottom: 12 }}>
        <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: '#B6AEFF', alignItems: 'center', justifyContent: 'center' }}><Txt w={700} size={20} color="#1E1446" tr={false}>{(nm || 'S')[0].toUpperCase()}</Txt></View>
        <View style={{ flex: 1, minWidth: 0 }}><Txt w={700} tr={false} numberOfLines={1}>{nm || t('Not signed in')}</Txt><Txt muted size={14} tr={false} numberOfLines={1}>{u ? (u.email || t('Signed in with') + ' ' + u.provider) : t('Sign in to keep your data safe')}</Txt></View>
      </View>
      {signedIn ? (
        <View style={{ padding: 16, borderRadius: 24, backgroundColor: c.surface, marginBottom: 12, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}><Icon name="sync" size={20} color={c.ink} /></View>
            <View style={{ flex: 1 }}><Txt w={700}>Cloud sync</Txt><Txt muted size={14} tr={false}>{syLabel()}</Txt></View>
            <Btn sm label="Sync now" busy={SY.state === 'syncing'} onPress={() => syNow()} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}><Txt w={700}>End-to-end encryption</Txt><Txt muted size={14}>{M.e2e ? (SY.locked ? 'On. Locked on this device.' : 'On for Break free, journals and notes.') : 'Lock your most private data with a passphrase.'}</Txt></View>
            {M.e2e ? (SY.locked ? <Btn sm kind="primary" label="Unlock" onPress={openUnlock} /> : <Btn sm label="Turn off" onPress={async () => { try { if (await e2eOff()) toast('Encryption is off'); } catch (e) { toastRaw(sbErr(e)); } }} />) : <Btn sm kind="primary" label="Turn on" onPress={openE2E} />}
          </View>
        </View>) : null}
      <Pressable accessibilityRole="button" onPress={() => { tap(); router.push('/paywall'); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 24, backgroundColor: CT.night.bg }}>
        <View style={{ flex: 1 }}><Txt w={700} color={CT.night.t}>Selah Plus</Txt><Txt size={14} color={CT.night.t} tr={false} style={{ opacity: 0.85 }}>{S.plus ? t('Active') + ', ' + t((PLANS[S.plus.plan] || { name: 'Plus' }).name) + (S.plus.test ? ' (' + t('test') + ')' : '') : t('See plans and start a free trial')}</Txt></View>
        <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><Icon name="arrow" size={18} color="#17101F" /></View>
      </Pressable>

      <Sec title="Reminders" />
      <NavRow icon="bell" title="Notifications" sub={ns === 'granted' ? t('On. Choose what Selah reminds you about.') : ns === 'denied' ? t('Blocked in your phone settings') : ns === 'unsupported' ? t('Shown inside Selah') : t('Off. Tap to turn on.')} badge={nCount} onPress={() => router.push('/notifications')} />
      <NavRow icon="phone" title="Widgets" sub={t('Put a verse on your home screen')} onPress={() => router.push('/widgets')} />

      <Sec title="Language and Bible" />
      <Field label="Language"><Seg options={Object.entries(LANGS).map(([k, v]) => [k, v.n] as [string, string])} value={s.lang} onChange={v => setLang(v)} /></Field>
      <Field label="Bible version" hint="Verses, search, cards and read-aloud use this version. The French and Russian texts are public domain and work offline.">
        <View style={{ gap: 8 }}>{Object.entries(VERS).map(([k, v]) => { const on = s.ver === k; return (
          <Pressable key={k} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => { tap(); setVersion(k); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 20, backgroundColor: on ? c.surface : c.surface2, borderWidth: 2, borderColor: on ? c.accent : 'transparent' }}>
            <View style={{ minWidth: 58, height: 40, paddingHorizontal: 8, borderRadius: 12, backgroundColor: on ? c.pill : c.surface, alignItems: 'center', justifyContent: 'center' }}><Txt w={700} size={13} tr={false} color={on ? c.onPill : c.ink}>{v.abbr}</Txt></View>
            <View style={{ flex: 1 }}><Txt w={700} tr={false}>{v.n}</Txt><Txt muted size={13} tr={false}>{v.sub}</Txt></View>
            {on ? <Icon name="check" color={c.accent} /> : null}
          </Pressable>); })}</View>
      </Field>

      <Sec title="Look and feel" />
      <Field label="Appearance"><Seg options={[['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']]} value={s.theme} onChange={v => mutate(x => { x.settings.theme = v; })} /></Field>
      <Field label="Bible text size">
        <Slider accessibilityLabel={t('Bible text size')} minimumValue={16} maximumValue={30} step={1} value={s.font} onValueChange={v => mutate(x => { x.settings.font = Math.round(v); }, { quiet: true })} onSlidingComplete={() => mutate(() => {})} minimumTrackTintColor={c.accent} maximumTrackTintColor={c.line} thumbTintColor={c.accent} />
        <View style={{ borderRadius: 18, padding: 12, paddingHorizontal: 14, backgroundColor: c.surface2, marginTop: 8 }}><Txt size={s.font} lh={1.6} serif={s.read === 'serif'}>The Lord is my shepherd; I shall not want.</Txt></View>
      </Field>
      <Field label="Bible typeface"><Seg options={[['sans', 'Sans'], ['serif', 'Serif']]} value={s.read} onChange={v => mutate(x => { x.settings.read = v; })} /></Field>
      <Field label="Card colour"><Chips><Chip label="Match prayer time" on={s.card === 'auto'} onPress={() => mutate(x => { x.settings.card = 'auto'; })} />{CT_KEYS.map(k => <Chip key={k} label={CT[k].n} on={s.card === k} onPress={() => mutate(x => { x.settings.card = k; })} />)}</Chips></Field>

      <Sec title="Privacy" />
      <SetRow title="Passcode lock" sub="Ask for a passcode each time Selah opens" right={<Switch value={lk.on} a11y="Passcode lock" onChange={() => { if (!lk.on) lockOpen('set'); else lockOpen('old', () => { mutate(x => { Object.assign(x.lock, { on: false, hash: '', salt: '', bio: '', fails: 0, until: 0 }); }); toast('Passcode is off'); }); }} />} />
      {lk.on ? (
        <View style={{ marginBottom: 12 }}>
          <Txt w={600} size={14} style={{ marginBottom: 8 }}>Lock after leaving the app</Txt>
          <Seg options={[[0, 'Immediately'], [60000, '1 min'], [300000, '5 min'], [900000, '15 min']]} value={lk.after} onChange={v => mutate(x => { x.lock.after = v; })} style={{ marginBottom: 18 }} />
          {bioAvailable() ? <SetRow title="Fingerprint or face unlock" sub="Use your phone’s screen lock instead of typing" right={<Switch value={!!lk.bio} a11y="Fingerprint or face unlock" onChange={async v => { if (!v) mutate(x => { x.lock.bio = ''; }); else await bioRegister(); }} />} /> : null}
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            <Btn sm label="Change passcode" onPress={() => lockOpen('old', () => lockOpen('set'))} />
            <Btn sm icon="lock" label="Lock now" onPress={() => lockOpen('unlock')} />
          </View>
        </View>) : null}
      <Txt muted size={14} style={{ marginTop: 4 }}>Your passcode is stored on this device as a protected hash, never as the digits themselves. If you forget it, the only way back in is to erase Selah’s data on this device.</Txt>

      <Sec title="Account" />
      <Txt muted size={14} style={{ marginBottom: 14 }}>{signedIn ? 'Goals, saved verses, highlights and notes sync to your account.' : 'Goals, saved verses, highlights and notes stay on this device.'}</Txt>
      <Btn block icon="arrowr" label="Sign out" onPress={() => { if (signedIn) openSignOut(); else { mutate(x => { x.user = null; }); router.back(); toast('Signed out'); } }} />
      {signedIn ? <Pressable accessibilityRole="button" onPress={openDeleteAccount} style={{ marginTop: 18, alignSelf: 'center', padding: 8 }}><Txt w={600} color={c.danger}>Delete my account</Txt></Pressable> : null}
      <Txt muted size={12} tr={false} center style={{ marginTop: 22 }}>{'Selah ' + ((Constants.expoConfig && Constants.expoConfig.version) || '') + ' · ' + Platform.OS}</Txt>
    </Page>
  );
}
function Sec({ title }: { title: string }) {
  return <Txt w={700} size={20} ls={-0.02} style={{ marginTop: 30, marginBottom: 14 }}>{title}</Txt>;
}
function NavRow({ icon, title, sub, badge, onPress }: { icon: string; title: string; sub: string; badge?: number; onPress: () => void }) {
  const c = useC();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={t(title) + ', ' + sub} onPress={() => { tap(); onPress(); }} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 22, backgroundColor: c.surface, marginBottom: 8, opacity: pressed ? 0.85 : 1 })}>
      <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={20} color={c.ink} /></View>
      <View style={{ flex: 1 }}><Txt w={700}>{title}</Txt><Txt muted size={14} tr={false}>{sub}</Txt></View>
      {badge ? <View style={{ minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: 11, backgroundColor: '#FF5A7A', alignItems: 'center', justifyContent: 'center' }}><Txt w={700} size={12} color="#fff" tr={false}>{String(badge)}</Txt></View> : null}
      <Icon name="chevr" size={18} color={c.muted} />
    </Pressable>
  );
}
