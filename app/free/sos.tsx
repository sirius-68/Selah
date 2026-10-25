import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Linking, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { mutate, useStore } from '@/lib/store';
import { VAFF } from '@/lib/content';
import { passageOf } from '@/lib/bible';
import { planFor, trk, trMigrate, trigList, urgesOf } from '@/lib/free';
import { pad } from '@/lib/util';
import { refShow, t } from '@/lib/i18n';
import { SND, playScape, stopScape } from '@/lib/sound';
import { useSound } from '@/lib/hooks';
import { Page, go, toast } from '@/ui/overlay';
import { AffCard } from '@/features/blocks';
import { Block, Btn, Chip, Chips, Seg, Title, Txt, useC, ProgBar } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { IfThen, openPrayWithMe } from '@/features/freeUI';

const P = ['Breathe in', 'Hold', 'Breathe out', 'Hold'];
export default function Sos() {
  useStore(); useSound(); const c = useC(); const { id } = useLocalSearchParams<{ id: string }>();
  const x = trMigrate(trk(id)); const at = useRef(Date.now()).current;
  const [int, setInt] = useState<number | null>(null); const [trig, setTrig] = useState<string[]>([]); const [stage, setStage] = useState<'help' | 'after'>('help');
  const [surf, setSurf] = useState(0); const [dur, setDur] = useState(10); const [, tick] = useState(0); const logged = useRef(false);
  const [bi, setBi] = useState(0); const sc = useRef(new Animated.Value(0)).current;
  useEffect(() => { const i = setInterval(() => setBi(b => (b + 1) % 4), 4000); return () => clearInterval(i); }, []);
  useEffect(() => { Animated.timing(sc, { toValue: bi === 0 ? 1 : bi === 2 ? 0 : bi === 1 ? 1 : 0, duration: bi % 2 ? 10 : 3900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }).start(); }, [bi]);
  useEffect(() => { if (!surf) return; const i = setInterval(() => { tick(n => n + 1); if (Date.now() >= surf) { clearInterval(i); setSurf(0); toast('Time’s up. How is the urge now?'); setStage('after'); } }, 1000); return () => clearInterval(i); }, [surf]);
  const log = (out: string | null, int2: number | null) => { if (logged.current || !x) return; logged.current = true; mutate(s => { (s.rec.urges[x.id] = s.rec.urges[x.id] || []).push({ at, int, int2, trig: trig.slice(), out, mins: Math.round((Date.now() - at) / 6e4) }); }); };
  useEffect(() => () => { if (!logged.current && int != null) log(null, null); }, [int]);
  if (!x) return <Page title=""><Txt muted>This tracker was removed.</Txt></Page>;
  const U = urgesOf(x.id), rode = U.filter((u: any) => u.out === 'passed').length;
  const vref = ['1 Corinthians 10:13', 'James 4:7', 'Psalm 40:2', 'Hebrews 4:15-16', 'Isaiah 41:10', '2 Corinthians 12:9'][U.length % 6];
  if (stage === 'after') return (
    <Page title="Craving help">
      <Title a="You rode" b="it out." style={{ marginTop: 6, marginBottom: 12 }} />
      <Txt muted size={16} tr={false} style={{ marginBottom: 18 }}>{t(`That makes ${rode + 1} urge${rode + 1 === 1 ? '' : 's'} you’ve ridden out. Each one makes the next a little weaker.`)}</Txt>
      <Txt w={600} size={14} style={{ marginBottom: 10 }}>How strong is it now?</Txt>
      <Lvl from={0} onPick={v => { log('passed', v); const n = urgesOf(x.id).filter((u: any) => u.out === 'passed').length; toast(n === 1 ? '1 urge ridden out. Well done.' : t('{n} urges ridden out. Well done.').replace('{n}', String(n))); router.replace({ pathname: '/free', params: { id: x.id, tab: 'progress' } }); }} />
      <Btn block style={{ marginTop: 16 }} label="Skip" onPress={() => { log('passed', null); router.replace({ pathname: '/free', params: { id: x.id, tab: 'progress' } }); }} />
    </Page>
  );
  const plan = planFor(x, trig), sd = surf ? Math.max(0, Math.round((surf - Date.now()) / 1000)) : 0;
  return (
    <Page title="Craving help">
      <Title a="This will" b="pass." style={{ marginTop: 6, marginBottom: 10 }} />
      <View style={{ height: 230, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={{ position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#B6AEFF', opacity: 0.25, transform: [{ scale: sc.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1.1] }) }] }} />
        <Animated.View style={{ width: 150, height: 150, borderRadius: 75, backgroundColor: '#B6AEFF', alignItems: 'center', justifyContent: 'center', transform: [{ scale: sc.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.08] }) }] }}>
          <Txt w={700} size={18} color="#1E1446">{P[bi]}</Txt>
        </Animated.View>
      </View>
      <Txt muted size={13.5} center style={{ marginTop: -4, marginBottom: 22 }}>Follow the circle: in for 4, hold for 4, out for 4, hold for 4.</Txt>
      <View style={{ backgroundColor: c.surface, borderRadius: 26, padding: 16, marginBottom: 12 }}>
        <Txt w={600} size={14} style={{ marginBottom: 10 }}>How strong is the urge?</Txt>
        <Lvl from={1} value={int} onPick={setInt} />
        <Txt w={600} size={14} style={{ marginTop: 16, marginBottom: 10 }}>{t('What set it off?') + ' '}<Txt muted w={500} size={14}>(optional)</Txt></Txt>
        <Chips>{trigList(x).slice(0, 12).map(tg => <Chip key={tg} sm label={tg} on={trig.includes(tg)} onPress={() => setTrig(trig.includes(tg) ? trig.filter(z => z !== tg) : [...trig, tg])} />)}</Chips>
      </View>
      {plan ? <><Txt w={600} size={14} style={{ marginBottom: 8, marginTop: 4 }}>Your plan</Txt><IfThen hi when={plan.when} then={plan.then} /></> : null}
      <View style={{ backgroundColor: c.surface, borderRadius: 26, padding: 16, marginVertical: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1 }}><Txt w={700}>Ride it out</Txt><Txt muted size={13.5} tr={false}>{surf ? t('{n} left. Keep breathing.').replace('{n}', Math.floor(sd / 60) + ':' + pad(sd % 60)) : t('Most cravings rise, peak and fade. Wait it out before you decide anything.')}</Txt></View>
          {surf ? <Btn sm label="Stop" onPress={() => setSurf(0)} /> : null}
        </View>
        {surf ? <ProgBar pct={1 - sd / (dur * 60)} color="#B6AEFF" h={10} style={{ marginTop: 12 }} /> : <Seg options={[[5, '5 min'], [10, '10 min'], [15, '15 min']]} value={0 as number} onChange={m => { setDur(m); setSurf(Date.now() + m * 60000); }} style={{ marginTop: 12 }} />}
      </View>
      {x.reasons.length ? <Block k="day" v={0} radius={26} style={{ padding: 18, marginBottom: 12 }} art={{ size: 300, right: -120, top: -130 }}>
        <Txt w={700} size={13} style={{ opacity: 0.8 }}>Why you started</Txt>
        {x.reasons.map((r: string, i: number) => <Txt key={i} w={700} size={20} lh={1.2} tr={false} style={{ marginTop: 6 }}>{'• ' + r}</Txt>)}
      </Block> : <Pressable onPress={() => go('/free', { id: x.id, tab: 'plan' })} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.line, marginBottom: 12 }}><Icon name="plus" size={20} color={c.accent} /><Txt w={600} color={c.accent} style={{ flex: 1 }}>Add your reasons, so we can show them here</Txt></Pressable>}
      <AffCard k="dusk" v={U.length} tag="Hold on to this" aff={t(VAFF[vref])} verse={passageOf(vref)} refText={refShow(vref)} />
      <View style={{ gap: 10, marginTop: 12 }}>
        {x.sphone ? <View style={{ flexDirection: 'row', gap: 10 }}>
          <Btn icon="phone" label="Call" style={{ flex: 1 }} onPress={() => Linking.openURL('tel:' + String(x.sphone).replace(/[^\d+]/g, '')).catch(() => {})} />
          <Btn icon="msg" label="Text" style={{ flex: 1 }} onPress={() => Linking.openURL(`sms:${String(x.sphone).replace(/[^\d+]/g, '')}?body=${encodeURIComponent(t('Hey, I’m having a hard moment with my goal. Could you pray for me or give me a call?'))}`).catch(() => {})} />
        </View> : <Btn block icon="plus" label="Add a support person to call" onPress={() => go('/free/setup', { id: x.id })} />}
        <Btn block icon="hand" label="Pray with me" onPress={openPrayWithMe} />
        <Btn block kind={SND.playing ? 'primary' : 'default'} icon={SND.playing ? 'pause' : 'play'} iconFill={!SND.playing} label={SND.playing ? 'Stop the sounds' : 'Play rain sounds'} onPress={() => { if (SND.playing) { stopScape(); toast('Sounds stopped'); } else { playScape('rain'); toast('Rain is playing. Breathe slowly.'); } }} />
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 22 }}>
        <Btn kind="primary" icon="check" label="The urge passed" style={{ flex: 1.3 }} onPress={() => { setSurf(0); setStage('after'); }} />
        <Btn label="I gave in" style={{ flex: 1 }} onPress={() => { log('gave', null); router.replace({ pathname: '/free/check', params: { id: x.id, slip: '1', trig: trig.join('|') } }); }} />
      </View>
    </Page>
  );
}
function Lvl({ from, value, onPick }: { from: number; value?: number | null; onPick: (v: number) => void }) {
  const c = useC();
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{Array.from({ length: 11 - from }, (_, i) => i + from).map(v => (
    <Pressable key={v} accessibilityLabel={String(v)} accessibilityState={{ selected: value === v }} onPress={() => onPick(v)} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: value === v ? '#FFB0D4' : c.surface2 }}>
      <Txt w={700} tr={false} color={value === v ? '#4A0A14' : undefined}>{String(v)}</Txt>
    </Pressable>))}</View>;
}
