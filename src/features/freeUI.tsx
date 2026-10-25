/* Break free building blocks: hold-to-commit button, crave chart, calendar,
   patterns, and the sheets (pledge, plans, reward, grace, milestone). */
import React, { useRef, useState } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';
import { S, mutate } from '../lib/store';
import { MDESC, MILES, PLAN_SUG, SOS_PRAYER } from '../lib/content';
import { passageOf } from '../lib/bible';
import { DAY, dateKey, dayNum, money, todayK, keyDate } from '../lib/util';
import { fmtDate, refShow, t } from '../lib/i18n';
import { daysFree, frName, freeWindow, logsOf, planFor, slipDays, trMigrate, trigList, urgesOf, verseFor } from '../lib/free';
import { shareText } from '../lib/share';
import { F } from '../lib/theme';
import { Btn, Chip, Chips, Field, Input, Txt, useC } from '../ui/kit';
import { Icon } from '../ui/Icon';
import { closeSheet, go, openSheet, SheetTitle, toast } from '../ui/overlay';
import { Prev } from './bibleSheets';

/* press and hold to commit */
export function HoldButton({ label, onDone }: { label: string; onDone: () => void }) {
  const c = useC(); const prog = useRef(new Animated.Value(0)).current; const anim = useRef<Animated.CompositeAnimation | null>(null); const [held, setHeld] = useState(false);
  const start = () => { if (held) return; Haptics.selectionAsync().catch(() => {}); anim.current = Animated.timing(prog, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: false }); anim.current.start(({ finished }) => { if (finished) { setHeld(true); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); onDone(); } }); };
  const stop = () => { if (held) return; anim.current && anim.current.stop(); Animated.timing(prog, { toValue: 0, duration: 200, useNativeDriver: false }).start(); };
  return (
    <Pressable onPressIn={start} onPressOut={stop} accessibilityRole="button" accessibilityLabel={t(label)} accessibilityHint={t('Press and hold')} onAccessibilityTap={onDone}
      style={{ marginTop: 18, height: 64, borderRadius: 999, overflow: 'hidden', backgroundColor: c.surface2, justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: prog.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }), backgroundColor: '#F4F01E' }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}><Icon name="hand" color={c.ink} /><Txt w={700} size={16.5}>{label}</Txt></View>
    </Pressable>
  );
}

export function openPledge(x: any) {
  const vd = verseFor(x);
  openSheet(<View>
    <SheetTitle>Today’s pledge</SheetTitle>
    <Txt muted tr={false} style={{ marginTop: -8, marginBottom: 14 }}>{frName(x) + ', ' + t('day ' + (daysFree(x) + 1)).toLowerCase()}</Txt>
    <View style={{ padding: 18, borderRadius: 24, backgroundColor: '#B6AEFF' }}>
      <Txt w={700} size={22} lh={1.2} color="#1E1446">I choose freedom today. Not forever, just today, with God’s help.</Txt>
    </View>
    <View style={{ marginTop: 12 }}><Prev text={vd.r ? passageOf(vd.ref) : ''} refText={refShow(vd.ref)} /></View>
    <HoldButton label="Press and hold to pledge" onDone={() => { mutate(s => { const L = s.rec.logs[x.id] = s.rec.logs[x.id] || {}, k = todayK(); L[k] = L[k] || { tasks: {}, partial: true }; L[k].pledge = Date.now(); }); closeSheet(); toast('Pledge made. One day at a time.'); }} />
  </View>);
}

export function openAddPlan(x: any, when?: string) { openSheet(<AddPlan x={x} when={when} />); }
function AddPlan({ x, when }: { x: any; when?: string }) {
  trMigrate(x); const opts = trigList(x);
  const [w, setW] = useState(when || x.triggers[0] || opts[0]); const [v, setV] = useState(t(PLAN_SUG[w] || ''));
  return <View>
    <SheetTitle>New if-then plan</SheetTitle>
    <Txt w={600} size={14} style={{ marginBottom: 10 }}>When…</Txt>
    <Chips>{opts.map(o => <Chip key={o} label={o} on={o === w} onPress={() => { setW(o); if (!v || Object.values(PLAN_SUG).some(s => t(s) === v)) setV(t(PLAN_SUG[o] || '')); }} />)}</Chips>
    <Field label="I will…" style={{ marginTop: 16 }}><Input value={v} onChangeText={setV} maxLength={100} placeholder="Call someone, go for a walk, pray…" /></Field>
    <Btn kind="primary" block label="Save plan" onPress={() => { if (!v.trim()) { toast('Write what you will do'); return; } mutate(s => { const y = trMigrate(s.rec.trackers.find((z: any) => z.id === x.id)); y.plans.push({ when: w, then: v.trim() }); }); closeSheet(); toast('Plan saved'); }} />
  </View>;
}
export function openReward(x: any) { openSheet(<Reward x={x} />); }
function Reward({ x }: { x: any }) {
  const rw = x.reward || {}; const [n, setN] = useState(rw.name || ''); const [p, setP] = useState(rw.price ? String(rw.price) : '');
  return <View>
    <SheetTitle>Save toward a reward</SheetTitle>
    <Txt muted style={{ marginTop: -8, marginBottom: 16 }}>The money you don’t spend goes toward something good.</Txt>
    <Field label="What would you like?"><Input value={n} onChangeText={setN} maxLength={40} placeholder="New running shoes" /></Field>
    <Field label="Price"><Input value={p} onChangeText={setP} keyboardType="decimal-pad" placeholder="0.00" /></Field>
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {x.reward ? <Btn kind="danger" label="Remove" style={{ flex: 1 }} onPress={() => { mutate(s => { delete s.rec.trackers.find((z: any) => z.id === x.id).reward; }); closeSheet(); }} /> : null}
      <Btn kind="primary" label="Save" style={{ flex: 1 }} onPress={() => { const pr = parseFloat(p.replace(',', '.')) || 0; if (!n.trim() || !pr) { toast('Add a name and a price'); return; } mutate(s => { s.rec.trackers.find((z: any) => z.id === x.id).reward = { name: n.trim(), price: pr }; }); closeSheet(); }} />
    </View>
  </View>;
}
export function openGrace(x: any, rec: any) {
  const w = freeWindow(x, 30);
  openSheet(<View>
    <SheetTitle>Grace, not shame.</SheetTitle>
    <Prev text={passageOf('Lamentations 3:22-23')} refText={refShow('Lamentations 3:22-23')} />
    <PGrid cells={[[w.free + '/' + w.tot, 'days free, last 30'], [String(x.total), 'free days in all']]} />
    <Txt style={{ marginVertical: 14 }}>Your counter starts again today, but none of those days are lost. Tomorrow is a new morning.</Txt>
    {rec.lesson && rec.trig[0] ? <IfThen when={rec.trig[0]} then={rec.lesson} /> : null}
    <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
      <Btn label="Open my plan" style={{ flex: 1 }} onPress={() => { closeSheet(); go('/free', { id: x.id, tab: 'plan' }); }} />
      <Btn kind="primary" label="Keep going" style={{ flex: 1 }} onPress={closeSheet} />
    </View>
  </View>);
}
export function maybeCelebrate(x: any) {
  const n = daysFree(x), m = [...MILES].reverse().find(v => v <= n); if (!m || (x.cel || 0) >= m) return;
  mutate(s => { const y = s.rec.trackers.find((z: any) => z.id === x.id); if (y) y.cel = m; });
  if (Date.now() - x.created < 6e4 && m > 1) return;
  setTimeout(() => openSheet(<View style={{ alignItems: 'center' }}>
    <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: '#F4F01E', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}><Txt w={800} size={46} color="#17101F" tr={false}>{String(m)}</Txt></View>
    <SheetTitle style={{ textAlign: 'center' }}>{m === 1 ? '1 day free.' : m + ' days free.'}</SheetTitle>
    <Txt muted center style={{ marginTop: -10 }}>{MDESC[m]}</Txt>
    <View style={{ alignSelf: 'stretch', marginVertical: 18 }}><Prev text={passageOf('Galatians 5:1')} refText={refShow('Galatians 5:1')} /></View>
    <View style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch' }}>
      <Btn icon="share" label="Share" style={{ flex: 1 }} onPress={() => shareText(t('{n} days free, by God’s grace.').replace('{n}', String(m)) + '\n\n“' + passageOf('Galatians 5:1') + '”\n' + refShow('Galatians 5:1') + '\n\n' + t('Shared from Selah'))} />
      <Btn kind="primary" label="Keep going" style={{ flex: 1 }} onPress={closeSheet} />
    </View>
  </View>), 450);
}
export function openPrayWithMe() {
  openSheet(<View><SheetTitle>Pray with me</SheetTitle><Txt size={18} lh={1.55} style={{ marginBottom: 20 }}>{SOS_PRAYER}</Txt><Btn kind="primary" block label="Amen" onPress={closeSheet} /></View>);
}

export function IfThen({ when, then, hi }: { when: string; then: string; hi?: boolean }) {
  const c = useC();
  return <View style={{ padding: 14, borderRadius: 20, backgroundColor: hi ? '#F4F01E' : c.surface2, gap: 2 }}>
    <Txt muted size={12.5} color={hi ? 'rgba(23,16,31,0.7)' : undefined}>When</Txt><Txt w={700} tr={false} color={hi ? '#17101F' : undefined}>{t(when)}</Txt>
    <Txt muted size={12.5} color={hi ? 'rgba(23,16,31,0.7)' : undefined} style={{ marginTop: 6 }}>I will</Txt><Txt w={700} tr={false} color={hi ? '#17101F' : undefined}>{then}</Txt>
  </View>;
}
export function PGrid({ cells }: { cells: [string, string][] }) {
  const c = useC();
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{cells.map(([b, l], i) => <View key={i} style={{ flexGrow: 1, minWidth: '45%', padding: 14, borderRadius: 20, backgroundColor: c.surface }}><Txt w={700} size={22} tr={false}>{b}</Txt><Txt muted size={13}>{l}</Txt></View>)}</View>;
}

/* cravings over the last 14 days */
export function CraveChart({ x }: { x: any }) {
  const c = useC(); const L = logsOf(x.id), days: Date[] = []; for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(d); }
  const W = 340, H = 150, bw = W / 14;
  return (
    <View style={{ backgroundColor: c.surface, borderRadius: 26, padding: 16 }}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        {[0, 5, 10].map(v => { const y = H - 22 - (v / 10) * (H - 44); return <React.Fragment key={v}><Line x1={0} x2={W} y1={y} y2={y} stroke={c.line} strokeDasharray={v ? '3 4' : undefined} /><SvgText x={W} y={y - 4} textAnchor="end" fontSize={10} fill={c.muted} fontFamily={F[500]}>{v}</SvgText></React.Fragment>; })}
        {days.map((d, i) => { const l = L[dateKey(d)], x0 = i * bw + bw * 0.18, w = bw * 0.64;
          return <React.Fragment key={i}>
            {!l || l.partial ? <Circle cx={i * bw + bw / 2} cy={H - 24} r={2.5} fill={c.line} /> : <Rect x={x0} y={H - 22 - Math.max(4, (l.crave / 10) * (H - 44))} width={w} height={Math.max(4, (l.crave / 10) * (H - 44))} rx={Math.min(6, w / 2)} fill={l.clean ? '#23C25F' : '#FFB0D4'} />}
            {i % 2 ? null : <SvgText x={i * bw + bw / 2} y={H - 4} textAnchor="middle" fontSize={10} fill={c.muted} fontFamily={F[500]}>{d.getDate()}</SvgText>}
          </React.Fragment>; })}
      </Svg>
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#23C25F' }} /><Txt muted size={13}>Stayed free</Txt></View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFB0D4' }} /><Txt muted size={13}>Slipped</Txt></View>
      </View>
    </View>
  );
}
/* five-week calendar; tap a past day to check in for it */
export function FreeCal({ x }: { x: any }) {
  const c = useC(); trMigrate(x);
  const L = logsOf(x.id), sd = slipDays(x), today = new Date(), tdn = dayNum(today), first = dayNum(new Date(x.first));
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (6 - today.getDay())), cells: Date[] = [];
  for (let i = 34; i >= 0; i--) cells.push(new Date(end.getFullYear(), end.getMonth(), end.getDate() - i));
  return (
    <View style={{ backgroundColor: c.surface, borderRadius: 26, padding: 14 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {[0, 1, 2, 3, 4, 5, 6].map(i => <View key={'h' + i} style={{ width: '14.2857%', alignItems: 'center', paddingBottom: 6 }}><Txt muted size={12} tr={false}>{fmtDate(new Date(2026, 1, 1 + i), { weekday: 'narrow' })}</Txt></View>)}
        {cells.map((d, i) => { const dn = dayNum(d), k = dateKey(d), l = L[k] && !L[k].partial ? L[k] : null;
          const fut = dn > tdn, pre = dn < first, slip = sd.has(dn);
          const bg = fut || pre ? 'transparent' : slip ? '#FFB0D4' : '#23C25F';
          return <View key={i} style={{ width: '14.2857%', alignItems: 'center', paddingVertical: 3 }}>
            <Pressable disabled={fut || pre} onPress={() => go('/free/check', { id: x.id, d: k })} accessibilityLabel={fmtDate(d, { month: 'long', day: 'numeric' }) + (fut || pre ? '' : ', ' + t(slip ? 'Slipped' : 'Stayed free') + (l ? ', ' + t('Checked in') : ''))}
              style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: bg, opacity: fut ? 0.35 : pre ? 0.45 : 1, borderWidth: l ? 2.5 : dn === tdn ? 1.5 : 0, borderColor: l ? c.ink : c.ink, borderStyle: !l && dn === tdn ? 'dashed' : 'solid' }}>
              <Txt w={600} size={14} tr={false} color={fut || pre ? undefined : slip ? '#4A0A14' : '#06341B'}>{String(d.getDate())}</Txt>
            </Pressable>
          </View>; })}
      </View>
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
        {[['#23C25F', 'Free'], ['#FFB0D4', 'Slipped']].map(([col, l]) => <View key={l} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: col }} /><Txt muted size={13}>{l}</Txt></View>)}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><View style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: c.ink }} /><Txt muted size={13}>Checked in</Txt></View>
      </View>
    </View>
  );
}
export function Patterns({ x }: { x: any }) {
  const c = useC(); const U = urgesOf(x.id), L = logsOf(x.id), cnt: Record<string, number> = {}, add = (k: string) => { cnt[k] = (cnt[k] || 0) + 1; };
  U.forEach((u: any) => (u.trig || []).forEach(add)); Object.values(L).forEach((l: any) => { if (!l.partial) (l.trig || []).forEach(add); });
  const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 4), max = top.length ? top[0][1] : 1;
  const times = [...U.map((u: any) => u.at), ...(x.slips || [])], bk = [0, 0, 0, 0], BN = ['Morning', 'Afternoon', 'Evening', 'Night'];
  times.forEach((ms: number) => { const hr = new Date(ms).getHours(); bk[hr >= 5 && hr < 12 ? 0 : hr >= 12 && hr < 17 ? 1 : hr >= 17 && hr < 22 ? 2 : 3]++; });
  const bi = bk.indexOf(Math.max(...bk)), rode = U.filter((u: any) => u.out === 'passed').length;
  const drops = U.filter((u: any) => u.int != null && u.int2 != null), avgA = drops.length ? Math.round(drops.reduce((s: number, u: any) => s + u.int, 0) / drops.length) : 0, avgB = drops.length ? Math.round(drops.reduce((s: number, u: any) => s + u.int2, 0) / drops.length) : 0;
  if (!top.length && !U.length) return <View style={{ backgroundColor: c.surface, borderRadius: 26, padding: 18 }}><Txt muted size={14.5}>Use Craving help when an urge comes, and note what made the day harder when you check in. After a few days, your triggers and hardest times will show here.</Txt></View>;
  const cells: [string, string][] = [[String(rode), 'urges you rode out'], [times.length ? t(BN[bi]) : '–', 'hardest time of day']]; if (drops.length) cells.push([avgA + ' → ' + avgB, 'average urge strength, before and after riding it out']);
  return <View style={{ gap: 12 }}>
    <PGrid cells={cells} />
    {top.length ? <View style={{ backgroundColor: c.surface, borderRadius: 26, padding: 16 }}>
      <Txt w={600} size={14} style={{ marginBottom: 10 }}>Most common triggers</Txt>
      {top.map(([k, v]) => <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Txt size={14} style={{ width: 110 }} numberOfLines={1}>{k}</Txt>
        <View style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: c.surface2 }}><View style={{ width: `${Math.round(v / max * 100)}%`, height: '100%', borderRadius: 5, backgroundColor: '#FFB0D4' }} /></View>
        <Txt w={700} size={14} tr={false}>{String(v)}</Txt>
      </View>)}
      {planFor(x, [top[0][0]]) ? null : <Pressable onPress={() => openAddPlan(x, top[0][0])} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}><Icon name="plus" size={18} color={c.accent} /><Txt w={600} color={c.accent} tr={false}>{t('Make a plan for:') + ' ' + t(top[0][0])}</Txt></Pressable>}
    </View> : null}
  </View>;
}
