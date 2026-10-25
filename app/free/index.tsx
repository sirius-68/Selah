import React, { useEffect, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useStore, mutate } from '@/lib/store';
import { KINDS, MDESC, MILES, PH_KIND, REASON_SUG, SMOKE_HEALTH } from '@/lib/content';
import { passage } from '@/lib/bible';
import { checkedIn, daysFree, dayIdx, freeWindow, frName, liveCount, logsOf, nextMile, tasksFor, trk, trMigrate, trigList, verseFor } from '@/lib/free';
import { keyDate, money, todayK } from '@/lib/util';
import { fmtClockTime, fmtDate, fmtTime, refShow, t } from '@/lib/i18n';
import { openRef } from '@/screens/bibleNav';
import { useTick } from '@/lib/hooks';
import { Page, go } from '@/ui/overlay';
import { Block, BTag, Btn, Chip, Chips, Input, Seg, Title, Txt, useC, Lead, ProgBar, tap } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { AffCard, Tile, Tiles } from '@/features/blocks';
import { CraveChart, FreeCal, IfThen, Patterns, maybeCelebrate, openAddPlan, openPledge, openReward } from '@/features/freeUI';

const FR = { t: null as string | null, tab: 'today' };
export default function BreakFree() {
  const S = useStore(); const c = useC(); useTick(30000);
  const p = useLocalSearchParams<{ id?: string; tab?: string }>();
  const [tab, setTabS] = useState(p.tab || FR.tab); const setTab = (x: string) => { FR.tab = x; setTabS(x); };
  if (p.id && FR.t !== p.id && trk(p.id)) FR.t = p.id;
  const ts = S.rec.trackers;
  const x = ts.length ? trMigrate(trk(FR.t) || ts[0]) : null;
  useEffect(() => { if (x) maybeCelebrate(x); }, [x && x.id]);
  if (!x) return (
    <Page title="Break free">
      <Title a="Walk in" b="freedom." style={{ marginTop: 6 }} />
      <Lead style={{ marginTop: 14 }}>Leave a habit behind, one day at a time. Each morning you make a short pledge, each evening you check in, and when a craving hits, help is one tap away.</Lead>
      <View style={{ gap: 12 }}>{[['sunrise', 'Morning pledge', 'Choose freedom for today, with a verse to carry.'], ['heart', 'Craving help', 'Breathe, ride it out and remember your reasons.'], ['check', 'Evening check-in', 'Two questions and a short note. Slips are met with grace.']].map(([ic, b, s]) => (
        <View key={b} style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}><Icon name={ic} color={c.ink} /></View>
          <View style={{ flex: 1 }}><Txt w={700}>{b}</Txt><Txt muted size={14}>{s}</Txt></View>
        </View>))}</View>
      <Txt w={600} size={14} style={{ marginTop: 22, marginBottom: 10 }}>What are you leaving behind?</Txt>
      <Tiles>{Object.entries(KINDS).map(([k, K], i) => <Tile key={k} k={K.k} v={i} photo={PH_KIND[k]} seed={i} small title={K.n} go={null} onPress={() => go('/free/wizard', { k })} />)}</Tiles>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 18 }}><Icon name="lock" size={16} color={c.muted} /><Txt muted size={13.5} style={{ flex: 1 }}>Private and free. Your tracker, answers and journal stay on this device.</Txt></View>
    </Page>
  );
  FR.t = x.id;
  const K = KINDS[x.kind] || KINDS.other, n = daysFree(x), lc = liveCount(x), w30 = freeWindow(x, 30);
  return (
    <Page title="Break free" right={<View style={{ flexDirection: 'row', gap: 6 }}>
      <Pressable accessibilityLabel={t('Open check-in notes in My journal')} onPress={() => go('/journal', { tab: 'checkin' })} style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}><Icon name="journal" color={c.ink} /></Pressable>
      <Pressable accessibilityLabel={t('Tracker settings')} onPress={() => go('/free/setup', { id: x.id })} style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}><Icon name="pencil" color={c.ink} /></Pressable>
    </View>}>
      {ts.length > 1 ? <Chips scroll style={{ marginTop: 4, marginBottom: 14 }}>{ts.map((y: any) => <Chip key={y.id} tr={false} label={frName(y)} on={y.id === x.id} onPress={() => { FR.t = y.id; setTab(tab); }} />)}<Chip icon="plus" label="Add" onPress={() => go('/free/wizard')} /></Chips> : null}
      <Block k={K.k} v={1} photo={PH_KIND[x.kind] || 'valley'} radius={36} style={{ padding: 22, paddingTop: 18, paddingBottom: 26 }} art={{ size: 440, right: -150, top: -140 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <BTag label={frName(x)} tr={false} />
          {ts.length > 1 ? null : <Pressable onPress={() => go('/free/wizard')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 28, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.2)' }}><Icon name="plus" size={14} color="#fff" /><Txt w={600} size={13} color="#fff">Add</Txt></Pressable>}
        </View>
        <Txt w={600} size={15} color="rgba(255,255,255,0.9)" style={{ marginTop: 70 }}>Free for</Txt>
        <Txt w={700} size={56} lh={1} ls={-0.04} color="#fff" tr={false}>{t(n + (n === 1 ? ' day' : ' days'))}</Txt>
        <Txt size={14.5} color="rgba(255,255,255,0.9)" tr={false} style={{ marginTop: 6 }}>{t(lc.h + ' h ' + lc.m + ' min') + ' · ' + t('Since') + ' ' + fmtDate(x.start, { month: 'long', day: 'numeric', year: 'numeric' }) + ', ' + fmtClockTime(x.start)}</Txt>
        <View style={{ flexDirection: 'row', gap: 14, marginTop: 16 }}>
          {[[w30.free + '/' + w30.tot, 'days free, last 30'], [String(Math.max(x.best || 0, n)), 'longest'], [String(n + (x.total || 0)), 'free days in all']].map(([b, l]) => <View key={l} style={{ flex: 1 }}><Txt w={700} size={19} color="#fff" tr={false}>{b}</Txt><Txt size={12.5} color="rgba(255,255,255,0.85)">{l}</Txt></View>)}
        </View>
      </Block>
      <Btn kind="primary" icon="heart" iconFill label="I’m feeling a craving" style={{ marginTop: 14, minHeight: 60, backgroundColor: '#FFB0D4' }} onPress={() => go('/free/sos', { id: x.id })} />
      <Seg options={[['today', 'Today'], ['progress', 'Progress'], ['plan', 'My plan']]} value={tab} onChange={setTab} style={{ marginTop: 18, marginBottom: 6 }} />
      {tab === 'progress' ? <Progress x={x} /> : tab === 'plan' ? <Plan x={x} /> : <Today x={x} />}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 22 }}><Icon name="lock" size={16} color={c.muted} /><Txt muted size={13.5} style={{ flex: 1 }}>Your tracker, answers and journal stay on this device.</Txt></View>
    </Page>
  );
}

function Row({ done, icon, title, sub, onPress, right }: { done?: boolean; icon: string; title: string; sub?: string; onPress?: () => void; right?: React.ReactNode }) {
  const c = useC();
  return (
    <Pressable disabled={!onPress} onPress={() => { tap(); onPress && onPress(); }} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 20, backgroundColor: pressed ? c.surface2 : 'transparent' })}>
      <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? '#23C25F' : c.surface2 }}><Icon name={done ? 'check' : icon} size={18} color={done ? '#06341B' : c.ink} stroke={done ? 2.6 : 1.9} /></View>
      <View style={{ flex: 1 }}><Txt w={600} tr={false} style={done ? { opacity: 0.75 } : undefined}>{title}</Txt>{sub ? <Txt muted size={13} tr={false}>{sub}</Txt> : null}</View>
      {right}
    </Pressable>
  );
}
function Today({ x }: { x: any }) {
  const c = useC(); const L = logsOf(x.id), tl0 = L[todayK()], tl = tl0 && !tl0.partial ? tl0 : null, pl = tl0 && tl0.pledge, tasks = tasksFor(x), td = (tl0 && tl0.tasks) || {}, vd = verseFor(x);
  const doneN = (pl ? 1 : 0) + Object.keys(td).length + (tl ? 1 : 0);
  const notes = Object.keys(L).filter(k => L[k].journal && !L[k].partial).sort().reverse().slice(0, 3);
  return <View>
    <View style={{ backgroundColor: c.surface, borderRadius: 28, padding: 16, marginTop: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
        <View><Txt w={700} size={21}>Today</Txt><Txt muted size={14}>{doneN === 5 ? 'All done. Well done today.' : `${doneN} of 5 done`}</Txt></View>
        <View style={{ width: 54, height: 54, borderRadius: 27, borderWidth: 5, borderColor: doneN === 5 ? '#23C25F' : c.surface2, alignItems: 'center', justifyContent: 'center' }}><Txt w={700} size={13} tr={false}>{doneN + '/5'}</Txt></View>
      </View>
      <ProgBar pct={doneN / 5} color="#23C25F" style={{ marginTop: 12, marginBottom: 6, marginHorizontal: 4 }} />
      {pl ? <Row done icon="sunrise" title={t('Morning pledge')} sub={t('Made at') + ' ' + fmtClockTime(pl)} /> : <Row icon="sunrise" title={t('Make today’s pledge')} sub={t('Choose freedom for today')} onPress={() => openPledge(x)} right={<Icon name="chevr" size={18} color={c.muted} />} />}
      {tasks.map((tk, i) => <Row key={i} done={!!td[i]} icon="check" title={t(tk)} onPress={() => mutate(s => { const LL = s.rec.logs[x.id] = s.rec.logs[x.id] || {}, k = todayK(); LL[k] = LL[k] || { tasks: {}, crave: null, partial: true }; LL[k].tasks = LL[k].tasks || {}; if (LL[k].tasks[i]) delete LL[k].tasks[i]; else LL[k].tasks[i] = true; })} />)}
      {tl ? <Row done icon="check" title={t('Evening check-in')} sub={t(tl.clean ? 'You stayed free today' : 'You were honest about a hard day') + ', ' + t(`cravings ${tl.crave}/10`)} onPress={() => go('/free/check', { id: x.id })} right={<Txt w={700} size={13} color={c.accent}>Edit</Txt>} />
        : <Row icon="check" title={t('Evening check-in')} sub={t('2 questions and a short note')} onPress={() => go('/free/check', { id: x.id })} right={<Icon name="chevr" size={18} color={c.muted} />} />}
    </View>
    <Txt w={700} size={21} style={{ marginTop: 28, marginBottom: 12 }}>Today’s scripture</Txt>
    <AffCard k="dusk" v={dayIdx(x)} photo={['sunrise', 'path', 'faith', 'lake', 'forest'][dayIdx(x) % 5]} seed={dayIdx(x)} tag={t('Day ' + (dayIdx(x) + 1))} tagTr={false} onGo={() => openRef(vd.ref)} aff={t(vd.a)} verse={vd.r ? passage(vd.r) : ''} refText={refShow(vd.ref)} />
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 28, paddingBottom: 12 }}><Txt w={700} size={21}>Your notes</Txt>{notes.length ? <Pressable onPress={() => go('/journal', { tab: 'checkin' })}><Txt w={600} color={c.accent}>See all</Txt></Pressable> : null}</View>
    {notes.length ? notes.map(k => { const l = L[k]; return (
      <Pressable key={k} onPress={() => go('/free/check', { id: x.id, d: k })} style={{ backgroundColor: c.surface, borderRadius: 26, padding: 18, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Icon name="journal" size={18} color={c.ink} /><Txt w={700} tr={false}>{fmtDate(keyDate(k), { weekday: 'long', month: 'long', day: 'numeric' })}</Txt></View>
        <Txt muted size={14} tr={false} style={{ marginTop: 4 }}>{t(l.clean ? 'Stayed free' : 'Hard day') + ', ' + t(`cravings ${l.crave}/10`) + (l.mood ? ', ' + l.mood.split(', ').map((m: string) => t(m).toLowerCase()).join(', ') : '')}</Txt>
        <Txt size={15} tr={false} style={{ marginTop: 8 }} numberOfLines={4}>{l.journal}</Txt>
      </Pressable>); })
      : <View style={{ backgroundColor: c.surface, borderRadius: 26, padding: 18 }}><Txt muted size={14.5}>Leave a short note when you check in. Your notes show here and in My journal, under Check-in notes.</Txt></View>}
  </View>;
}
function Progress({ x }: { x: any }) {
  const c = useC(); const n = daysFree(x), nm = nextMile(n), prev = [...MILES].reverse().find(m => m <= n) || 0, tot = n + (x.total || 0);
  const pct = nm ? Math.min(1, (n - prev) / (nm - prev)) : 1, money2 = x.cost ? money(x.cost * tot) : '', hrs = x.hours ? x.hours * tot : 0;
  return <View>
    <View style={{ backgroundColor: c.surface, borderRadius: 28, padding: 18, marginTop: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}><Txt w={700} size={21}>Next milestone</Txt>{nm ? <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: '#F4F01E' }}><Txt w={700} size={13} color="#17101F">{nm + ' days'}</Txt></View> : null}</View>
      {nm ? <><ProgBar pct={pct} color="#B6AEFF" h={10} /><Txt muted size={14} style={{ marginTop: 8 }}>{`${nm - n} day${nm - n === 1 ? '' : 's'} to your ${nm}-day milestone.`}</Txt></> : <Txt muted>You have passed every milestone. One whole year free.</Txt>}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>{MILES.map(m => <View key={m} style={{ minWidth: 52, paddingVertical: 8, paddingHorizontal: 8, borderRadius: 16, alignItems: 'center', backgroundColor: n >= m ? '#23C25F' : c.surface2, borderWidth: m === nm ? 2 : 0, borderColor: '#F4F01E' }}><Txt w={700} size={16} tr={false} color={n >= m ? '#06341B' : undefined}>{String(m)}</Txt><Txt size={11} color={n >= m ? '#06341B' : c.muted}>{m === 1 ? 'day' : 'days'}</Txt></View>)}</View>
      {prev ? <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, alignItems: 'flex-start' }}><Icon name="spark" size={18} color={c.accent} /><Txt size={14.5} style={{ flex: 1 }}>{MDESC[prev]}</Txt></View> : null}
    </View>
    <Txt w={700} size={21} style={{ marginTop: 28 }}>Calendar</Txt>
    <Txt muted size={14} style={{ marginBottom: 12, marginTop: 4 }}>Tap a past day to check in for it.</Txt>
    <FreeCal x={x} />
    {money2 || hrs || x.reward ? <>
      <Txt w={700} size={21} style={{ marginTop: 28, marginBottom: 12 }}>Won back</Txt>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
        {money2 ? <View style={{ flex: 1, padding: 16, borderRadius: 24, backgroundColor: c.surface }}><View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}><Icon name="gift" size={20} color={c.ink} /></View><Txt w={700} size={24} tr={false}>{money2}</Txt><Txt muted size={13}>money not spent</Txt></View> : null}
        {hrs ? <View style={{ flex: 1, padding: 16, borderRadius: 24, backgroundColor: c.surface }}><View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}><Icon name="clock" size={20} color={c.ink} /></View><Txt w={700} size={24} tr={false}>{t(Math.round(hrs) < 48 ? Math.round(hrs) + (Math.round(hrs) === 1 ? ' hour' : ' hours') : Math.round(hrs / 24) + ' days')}</Txt><Txt muted size={13}>of your life back</Txt></View> : null}
      </View>
      {x.reward && x.reward.name ? (() => { const have = (x.cost || 0) * tot, pr = Math.min(1, x.reward.price ? have / x.reward.price : 0); return (
        <Pressable onPress={() => openReward(x)} style={{ padding: 16, borderRadius: 24, backgroundColor: c.surface }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}><View><Txt muted size={13}>Saving toward</Txt><Txt w={700} tr={false}>{x.reward.name}</Txt></View><Txt muted size={13.5} tr={false}>{money(Math.min(have, x.reward.price || 0)) + ' / ' + money(x.reward.price || 0)}</Txt></View>
          <ProgBar pct={pr} color="#23C25F" h={10} />
          {pr >= 1 ? <Txt size={14} style={{ marginTop: 10 }}>You’ve saved enough. Enjoy it with a thankful heart.</Txt> : null}
        </Pressable>); })() : null}
    </> : null}
    {!x.reward && x.cost ? <AddRow icon="gift" label="Set a reward to save toward" onPress={() => openReward(x)} /> : null}
    <Txt w={700} size={21} style={{ marginTop: 28, marginBottom: 12 }}>Patterns</Txt>
    <Patterns x={x} />
    <Txt w={700} size={21} style={{ marginTop: 28, marginBottom: 12 }}>Cravings, last 14 days</Txt>
    <CraveChart x={x} />
    {x.kind === 'smoking' ? (() => { const mins = (Date.now() - x.start) / 6e4; return <>
      <Txt w={700} size={21} style={{ marginTop: 28, marginBottom: 12 }}>Your body is healing</Txt>
      {SMOKE_HEALTH.map(([m, when, txt]) => <View key={m} style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
        <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: mins >= m ? '#23C25F' : c.surface2, alignItems: 'center', justifyContent: 'center' }}>{mins >= m ? <Icon name="check" size={14} color="#06341B" stroke={2.8} /> : null}</View>
        <View style={{ flex: 1 }}><Txt w={700}>{when}</Txt><Txt muted size={13.5}>{txt}</Txt></View></View>)}
      <Txt muted size={13}>Source: World Health Organization. Timings are averages and vary from person to person.</Txt>
    </>; })() : null}
  </View>;
}
function AddRow({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  const c = useC();
  return <Pressable onPress={() => { tap(); onPress(); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.line, marginTop: 10 }}><Icon name={icon} size={20} color={c.accent} /><Txt w={600} color={c.accent} style={{ flex: 1 }}>{label}</Txt></Pressable>;
}
function Card({ title, sub, right, children }: { title: string; sub?: string; right?: React.ReactNode; children: React.ReactNode }) {
  const c = useC();
  return <View style={{ backgroundColor: c.surface, borderRadius: 28, padding: 18, marginTop: 12 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Txt w={700} size={21}>{title}</Txt>{right}</View>
    {sub ? <Txt muted size={14} style={{ marginTop: 4, marginBottom: 12 }}>{sub}</Txt> : <View style={{ height: 10 }} />}
    {children}
  </View>;
}
function Plan({ x }: { x: any }) {
  const c = useC(); const [reason, setReason] = useState(''); const [trig, setTrig] = useState('');
  const upd = (fn: (y: any) => void) => mutate(s => { fn(trMigrate(s.rec.trackers.find((z: any) => z.id === x.id))); });
  const sms = (body: string) => Linking.openURL(`sms:${String(x.sphone).replace(/[^\d+]/g, '')}?body=${encodeURIComponent(body)}`).catch(() => {});
  return <View>
    <Card title="My reasons" sub="We show these when a craving hits.">
      {x.reasons.map((r: string, i: number) => <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}><Txt tr={false} style={{ flex: 1 }}>{r}</Txt><Pressable accessibilityLabel={t('Remove')} onPress={() => upd(y => { y.reasons.splice(i, 1); y.why = y.reasons[0] || ''; })}><Icon name="x" size={18} color={c.muted} /></Pressable></View>)}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}><Input value={reason} onChangeText={setReason} maxLength={120} placeholder="Add a reason, like “For my kids”" style={{ flex: 1 }} /><Btn kind="primary" sm label="Add" onPress={() => { if (!reason.trim()) return; upd(y => { y.reasons.push(reason.trim()); y.why = y.reasons[0]; }); setReason(''); }} /></View>
      <Chips style={{ marginTop: 10 }}>{REASON_SUG.filter(r => !x.reasons.includes(r) && !x.reasons.includes(t(r))).slice(0, 5).map(r => <Chip key={r} sm icon="plus" label={r} onPress={() => upd(y => { y.reasons.push(t(r)); y.why = y.reasons[0]; })} />)}</Chips>
    </Card>
    <Card title="If-then plans" sub="Decide now what you’ll do when a trigger comes. Plans made ahead are easier to follow." right={<Pressable onPress={() => openAddPlan(x)}><Txt w={600} color={c.accent}>Add</Txt></Pressable>}>
      {x.plans.length ? <View style={{ gap: 8 }}>{x.plans.map((p: any, i: number) => <View key={i}><IfThen when={p.when} then={p.then} /><Pressable accessibilityLabel={t('Remove plan')} onPress={() => upd(y => { y.plans.splice(i, 1); })} style={{ position: 'absolute', top: 8, right: 8, padding: 6 }}><Icon name="x" size={18} color={c.muted} /></Pressable></View>)}</View>
        : <AddRow icon="plus" label="Make your first plan" onPress={() => openAddPlan(x)} />}
    </Card>
    <Card title="My triggers" sub="Tap the ones you know. Craving help will ask about them.">
      <Chips>{trigList(x).map(tg => <Chip key={tg} label={tg} on={x.triggers.includes(tg)} onPress={() => upd(y => { y.triggers = y.triggers.includes(tg) ? y.triggers.filter((z: string) => z !== tg) : [...y.triggers, tg]; })} />)}</Chips>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}><Input value={trig} onChangeText={setTrig} maxLength={40} placeholder="Add your own" style={{ flex: 1 }} /><Btn sm label="Add" onPress={() => { const v = trig.trim(); if (!v) return; upd(y => { if (!y.triggers.includes(v)) y.triggers.push(v); }); setTrig(''); }} /></View>
    </Card>
    <Card title="Support">
      {x.sphone ? <>
        <Txt muted size={14} tr={false} style={{ marginBottom: 12 }}>{t('Your support person:') + ' '}<Txt w={700} tr={false}>{x.sname || x.sphone}</Txt></Txt>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Btn sm icon="phone" label="Call" style={{ flex: 1 }} onPress={() => Linking.openURL('tel:' + String(x.sphone).replace(/[^\d+]/g, '')).catch(() => {})} />
          <Btn sm icon="msg" label="Text" style={{ flex: 1 }} onPress={() => sms(t('Hey, I’m having a hard moment with my goal. Could you pray for me or give me a call?'))} />
          <Btn sm icon="share" label="Share" style={{ flex: 1 }} onPress={() => sms(t('I’m {n} days free today. Thank you for standing with me.').replace('{n}', String(daysFree(x))))} />
        </View>
      </> : <>
        <Txt muted size={14} style={{ marginBottom: 4 }}>Someone you trust to call or text when it’s hard. Recovery goes better with people around you.</Txt>
        <AddRow icon="plus" label="Add a support person" onPress={() => go('/free/setup', { id: x.id })} />
      </>}
    </Card>
    <Card title="Reminders" right={<Pressable onPress={() => go('/free/setup', { id: x.id })}><Txt w={600} color={c.accent}>Change</Txt></Pressable>}>
      {[['sunrise', 'Morning pledge', x.remind], ['moon', 'Evening check-in', x.remind2]].map(([ic, l, v]) => <View key={l} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
        <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}><Icon name={ic} size={20} color={c.ink} /></View>
        <View><Txt w={700}>{l}</Txt><Txt muted size={13} tr={false}>{v ? fmtTime(v) : t('Off')}</Txt></View></View>)}
    </Card>
  </View>;
}
