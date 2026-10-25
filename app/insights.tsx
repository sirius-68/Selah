import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Svg, { Circle, Rect, Text as SvgText } from 'react-native-svg';
import { useStore } from '@/lib/store';
import { KINDS, CT } from '@/lib/content';
import { DAY } from '@/lib/util';
import { fmtDate, t } from '@/lib/i18n';
import { fmtLen, weekStats } from '@/lib/ur';
import { F } from '@/lib/theme';
import { Page, go } from '@/ui/overlay';
import { Block, BTag, Chip, Chips, Surface, Title, Txt, useC } from '@/ui/kit';
import { Icon } from '@/ui/Icon';

function delta(a: number, b: number, unit?: string) {
  if (!b && !a) return null; if (!b) return { up: true, txt: t('Up from 0 the week before') };
  const d = a - b; if (!d) return { up: null, txt: t('Same as the week before') };
  return { up: d > 0, txt: (d > 0 ? '+' : '−') + (unit === 'min' ? fmtLen(Math.abs(d)) : Math.abs(d)) + ' ' + t('vs the week before') };
}
function Delta({ v }: { v: ReturnType<typeof delta> }) { const c = useC(); if (!v) return null; return <Txt w={600} size={12.5} tr={false} color={v.up === null ? c.muted : v.up ? '#23C25F' : '#FF8597'} style={{ marginTop: 4 }}>{v.txt}</Txt>; }

export default function Insights() {
  const S = useStore(); const c = useC(); const p = useLocalSearchParams<{ o?: string }>();
  const [off, setOff] = useState(+(p.o || 0));
  const st = weekStats(off), pv = weekStats(off - 1), ws = new Date(st.a), we = new Date(st.a + 6 * DAY);
  const W = 340, H = 150, bw = W / 7, mx = Math.max(600, ...st.perDay), lbl = [1, 2, 3, 4, 5, 6, 0].map(i => fmtDate(new Date(2026, 1, 1 + i), { weekday: 'narrow' }));
  const packDays = Object.values(S.packs.prog).reduce((s: number, o: any) => s + Object.keys(o).length, 0);
  const tiles: [string, string, ReturnType<typeof delta>][] = [
    [fmtLen(st.med), t('Sleep Scapes and sounds'), delta(Math.round(st.med / 60), Math.round(pv.med / 60))],
    [String(st.goalsDone), t('quiet times completed'), delta(st.goalsDone, pv.goalsDone)],
    [String(st.heard), t('times you wrote what you heard'), delta(st.heard, pv.heard)],
    [String(st.notes), t('journal entries') + ', ' + t(st.words + ' words'), delta(st.notes, pv.notes)],
    [String(st.guide), t('Guide affirmations'), delta(st.guide, pv.guide)],
    [String(packDays), t('pack days done in all'), null],
  ];
  return (
    <Page title="Insights">
      <Title a="Your week" b="with God." style={{ marginBottom: 14 }} />
      <Chips style={{ marginBottom: 6 }}>{[[0, 'This week'], [-1, 'Last week'], [-2, '2 weeks ago']].map(([o, l]) => <Chip key={o} label={l as string} on={off === o} onPress={() => setOff(o as number)} />)}</Chips>
      <Txt muted size={13.5} tr={false} style={{ marginBottom: 16, marginTop: 6 }}>{fmtDate(ws, { month: 'short', day: 'numeric' }) + ' – ' + fmtDate(we, { month: 'short', day: 'numeric' })}</Txt>
      <Block k="night" v={0} radius={36} style={{ padding: 22 }} art={{ size: 440, right: -150, top: -140 }}>
        <BTag label="Prayer" />
        <Txt w={300} size={52} ls={-0.04} tr={false} style={{ marginTop: 18 }}>{fmtLen(st.secs)}</Txt>
        <Delta v={delta(Math.round(st.secs), Math.round(pv.secs), 'min')} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 18 }}>
          {[[st.count, 'sessions'], [st.watches, 'watches kept'], [st.prayDays + '/7', 'days with God'], [st.longest ? fmtLen(st.longest) : '0', 'longest']].map(([b, l], i) => (
            <View key={i} style={{ minWidth: '40%' }}><Txt w={700} size={20} tr={false}>{String(b)}</Txt><Txt size={13} style={{ opacity: 0.85 }}>{l as string}</Txt></View>))}
        </View>
      </Block>
      <Surface style={{ marginTop: 14 }}>
        <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
          {st.perDay.map((s, i) => { const h = s ? Math.max(6, s / mx * (H - 40)) : 0, x = i * bw + bw * 0.2, w = bw * 0.6, today = st.a + i * DAY <= Date.now() && Date.now() < st.a + (i + 1) * DAY;
            return <React.Fragment key={i}>
              {s ? <><Rect x={x} y={H - 22 - h} width={w} height={h} rx={8} fill="#B6AEFF" /><SvgText x={x + w / 2} y={H - 28 - h} textAnchor="middle" fontSize={10} fontFamily={F[700]} fill={c.ink}>{Math.round(s / 60)}</SvgText></> : <Circle cx={x + w / 2} cy={H - 25} r={2.5} fill={c.line} />}
              <SvgText x={x + w / 2} y={H - 5} textAnchor="middle" fontSize={11} fontFamily={today ? F[700] : F[500]} fill={today ? c.ink : c.muted}>{lbl[i]}</SvgText>
            </React.Fragment>; })}
        </Svg>
        <Txt muted size={13} style={{ marginTop: 4 }}>Minutes prayed each day</Txt>
      </Surface>
      <Txt w={700} size={21} style={{ marginTop: 28, marginBottom: 12 }}>Meditation and reflection</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {tiles.map(([b, l, d], i) => <View key={i} style={{ width: '48.4%', padding: 16, borderRadius: 22, backgroundColor: c.surface }}><Txt w={700} size={22} tr={false}>{b}</Txt><Txt muted size={13} tr={false}>{l}</Txt><Delta v={d} /></View>)}
      </View>
      {st.rec.length ? <>
        <Txt w={700} size={21} style={{ marginTop: 28, marginBottom: 12 }}>Break free</Txt>
        {st.rec.map((r, i) => { const pp = pv.rec[i], K = KINDS[r.t.kind] || KINDS.other, T = CT[K.k]; return (
          <Surface key={r.t.id} onPress={() => go('/free', { id: r.t.id })} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt w={700} tr={false}>{r.t.discreet ? t('Private tracker') : r.t.label}</Txt>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: T.bg }}><Txt w={600} size={12.5} color={T.t}>{r.free + (r.free === 1 ? ' day free' : ' days free')}</Txt></View>
            </View>
            <View style={{ flexDirection: 'row', marginTop: 12 }}>
              <View style={{ flex: 1 }}><Txt w={700} size={18} tr={false}>{r.checks + '/7'}</Txt><Txt muted size={12.5}>check-ins</Txt></View>
              <View style={{ flex: 1 }}><Txt w={700} size={18} tr={false}>{r.avg === null ? 'n/a' : String(r.avg)}</Txt><Txt muted size={12.5}>avg craving</Txt>{pp && pp.avg !== null && r.avg !== null && pp.avg !== r.avg ? <Txt w={600} size={12} tr={false} color={r.avg < pp.avg ? '#23C25F' : '#FF8597'}>{(r.avg < pp.avg ? '↓ ' : '↑ ') + t('from') + ' ' + pp.avg}</Txt> : null}</View>
              <View style={{ flex: 1 }}><Txt w={700} size={18} tr={false}>{String(r.slips)}</Txt><Txt muted size={12.5}>{r.slips === 1 ? 'slip' : 'slips'}</Txt></View>
            </View>
          </Surface>); })}
      </> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20 }}><Icon name="lock" size={16} color={c.muted} /><Txt muted size={13.5} style={{ flex: 1 }}>Your insights are worked out on this device from your own activity.</Txt></View>
    </Page>
  );
}
