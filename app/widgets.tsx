import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useStore, mutate } from '@/lib/store';
import { CT, CT_KEYS, ROT, ThemeKey, WDEF } from '@/lib/content';
import { ALL, passage, refLabel } from '@/lib/bible';
import { isPlus } from '@/lib/affirm';
import { fmtDate, fmtClockTime, refShow, t, locRefs } from '@/lib/i18n';
import { SERIF } from '@/lib/theme';
import { Page, toast } from '@/ui/overlay';
import { Btn, Chip, Chips, Field, Seg, Title, Txt, useC } from '@/ui/kit';
import { Ribbon } from '@/ui/Ribbon';
import { Pressable } from 'react-native';
import { syncWidget } from '@/lib/widget';

export default function Widgets() {
  const S = useStore(); const c = useC();
  const [w, setW] = useState<any>(() => Object.assign({}, WDEF, S.widget || {}));
  const [i, setI] = useState(0); useEffect(() => { const x = setInterval(() => setI(n => n + 1), 3800); return () => clearInterval(x); }, []);
  const set = (q: any) => setW((x: any) => ({ ...x, ...q }));
  const it = ALL[(i + 3) % ALL.length], ref = refLabel(it.r), vt = passage(it.r);
  const main = w.content === 'verse' ? '“' + vt + '”' : t(it.a), sub = w.content === 'both' ? '“' + vt + '”' : '';
  const T = CT[w.style as ThemeKey] || CT.dusk, serif = w.font === 'serif';
  return (
    <Page title="Widgets" back={false} right={isPlus() ? null : <View style={{ backgroundColor: '#B6AEFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 }}><Txt w={700} size={12.5} color="#1E1446">Plus</Txt></View>}>
      <Title a="Keep His word" b="in sight." style={{ marginTop: 6, marginBottom: 18 }} />
      <View style={{ height: 400, borderRadius: 36, backgroundColor: '#2A1A3A', padding: 18, marginBottom: 20, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}><Txt w={600} size={13} color="#fff" tr={false}>{fmtClockTime(new Date()).replace(/\s?[AP]M/i, '')}</Txt><Txt size={10} color="#fff" tr={false}>●●●</Txt></View>
        {w.size === 'lock' ? (
          <View style={{ alignItems: 'center' }}>
            <Txt w={300} size={70} color="#fff" tr={false}>{fmtClockTime(new Date()).replace(/\s?[AP]M/i, '')}</Txt>
            <Txt w={600} size={15} color="#fff" tr={false}>{fmtDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric' })}</Txt>
            <View style={{ marginTop: 22, padding: 14, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', width: '90%' }}>
              <Txt w={700} size={15} color="#fff" tr={false} numberOfLines={3} style={serif ? { fontFamily: SERIF } : undefined}>{main}</Txt>
              <Txt size={12} color="rgba(255,255,255,0.85)" tr={false} style={{ marginTop: 4 }}>{locRefs(ref)}</Txt>
            </View>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: 14 }}>
            <View style={{ width: w.size === 'small' ? 160 : '100%', height: 160, borderRadius: 26, backgroundColor: T.bg, overflow: 'hidden', padding: 14 }}>
              <Ribbon k={w.style} v={i} size={240} style={{ right: -90, top: -90 }} />
              <Txt w={700} size={11} color={T.t} tr={false} style={{ opacity: 0.8 }}>Selah</Txt>
              <Txt w={700} size={w.size === 'small' ? 14 : 17} lh={1.15} color={T.t} tr={false} numberOfLines={w.size === 'small' ? 4 : 3} style={[{ marginTop: 'auto' }, serif ? { fontFamily: SERIF, fontWeight: '400' } : null]}>{main}</Txt>
              {sub && w.size === 'medium' ? <Txt size={12} color={T.t} tr={false} numberOfLines={2} style={{ opacity: 0.85, marginTop: 4 }}>{sub}</Txt> : null}
              <Txt w={700} size={11} color={T.t} tr={false} style={{ marginTop: 6 }}>{refShow(ref)}</Txt>
            </View>
            {w.size === 'small' ? <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>{[0, 1, 2, 3].map(k => <View key={k} style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.18)' }} />)}</View> : null}
          </View>
        )}
        {w.size !== 'lock' ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginTop: 20 }}>{Array.from({ length: 8 }, (_, k) => <View key={k} style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.18)' }} />)}</View> : null}
      </View>
      <Field label="Size"><Seg options={[['small', 'Small'], ['medium', 'Medium'], ['lock', 'Lock screen']]} value={w.size} onChange={v => set({ size: v })} /></Field>
      {w.size === 'lock' ? null : <Field label="Colour"><View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>{CT_KEYS.map(k => <Pressable key={k} accessibilityLabel={CT[k].n} onPress={() => set({ style: k })} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: CT[k].bg, borderWidth: 3, borderColor: w.style === k ? c.ink : c.surface }} />)}</View></Field>}
      <Field label="Show"><Seg options={[['aff', 'Affirmation'], ['verse', 'Verse'], ['both', 'Both']]} value={w.content} onChange={v => set({ content: v })} /></Field>
      <Field label="New words"><Chips>{Object.entries(ROT).map(([k, l]) => <Chip key={k} label={l} on={w.rotate === k} onPress={() => set({ rotate: k })} />)}</Chips></Field>
      <Field label="Typeface"><Seg options={[['sans', 'Sans'], ['serif', 'Serif']]} value={w.font} onChange={v => set({ font: v })} /></Field>
      <Btn kind="primary" block icon={isPlus() ? undefined : 'lock'} label={isPlus() ? 'Save widget' : 'Save with Selah Plus'} onPress={() => { if (!isPlus()) { router.push('/paywall'); toast('Widgets come with Selah Plus'); return; } mutate(s => { s.widget = { ...w }; }); syncWidget(); toast('Widget saved'); }} />
      <Txt muted size={13.5} center style={{ marginTop: 12 }}>On Android, long-press your home screen, choose Widgets and add Selah. Your saved design is used there.</Txt>
    </Page>
  );
}
