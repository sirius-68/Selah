import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { router, useLocalSearchParams } from 'expo-router';
import { mutate, S, useStore } from '@/lib/store';
import { PLAN_SUG, RMOODS } from '@/lib/content';
import { daysFree, followUps, logsOf, trk, trMigrate, trigList } from '@/lib/free';
import { keyDate, todayK } from '@/lib/util';
import { fmtDate, t } from '@/lib/i18n';
import { Page, toast } from '@/ui/overlay';
import { Btn, Chip, Chips, Field, Input, OkMsg, SetRow, Switch, Title, Txt, useC, tap } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { openGrace } from '@/features/freeUI';

export default function CheckIn() {
  useStore(); const c = useC(); const p = useLocalSearchParams<{ id: string; d?: string; slip?: string; trig?: string }>();
  const x = trMigrate(trk(p.id)); const dk = p.d || todayK(), past = dk !== todayK();
  const [f, setF] = useState(() => {
    const L = x ? logsOf(x.id) : {}, ex = L[dk] && !L[dk].partial ? L[dk] : null;
    const st: any = { clean: ex ? ex.clean : null, crave: ex ? ex.crave : 3, mood: ex ? (ex.moods || (ex.mood ? ex.mood.split(', ') : [])) : [], journal: ex ? ex.journal || '' : '', qs: ex && ex.answers ? ex.answers.map((a: any) => a.q) : x ? followUps(x) : [], answers: ex && ex.answers ? ex.answers.map((a: any) => a.a) : [], trig: ex && ex.trig ? ex.trig.slice() : [], lesson: (ex && ex.lesson) || '', mkPlan: true, ex };
    if (p.slip) { st.clean = false; st.trig = [...new Set([...st.trig, ...(p.trig ? p.trig.split('|') : [])])]; }
    return st;
  });
  if (!x) return <Page title=""><Txt muted>This tracker was removed.</Txt></Page>;
  const set = (q: any) => setF((s: any) => ({ ...s, ...q }));
  const tl = trigList(x); const ex = f.ex;
  const save = () => {
    if (f.clean === null) { toast('Let us know how today went first'); return; }
    let slipNow = false, undone = false, rec: any = null;
    mutate(s => {
      const y = trMigrate(s.rec.trackers.find((z: any) => z.id === x.id)), L = s.rec.logs[y.id] = s.rec.logs[y.id] || {}, prevAll = L[dk] || null, prev = prevAll && !prevAll.partial ? prevAll : null;
      rec = { clean: f.clean, crave: f.crave, moods: f.mood.slice(), mood: f.mood.join(', '), trig: f.trig.slice(), lesson: f.clean === false ? (f.lesson || '').trim() : '', answers: f.qs.map((q: string, i: number) => ({ q, a: (f.answers[i] || '').trim() })), journal: f.journal.trim(), tasks: (prevAll && prevAll.tasks) || {}, pledge: (prevAll && prevAll.pledge) || null, at: Date.now(), slipApplied: prev ? prev.slipApplied : false, undo: prev ? prev.undo : null };
      if (!f.clean && !rec.slipApplied && dk === todayK()) { rec.undo = { start: y.start, best: y.best || 0, total: y.total || 0 }; const n = daysFree(y); y.best = Math.max(y.best || 0, n); y.total = (y.total || 0) + n; y.slips = y.slips || []; y.slips.push(Date.now()); y.start = Date.now(); y.cel = 0; rec.slipApplied = true; slipNow = true; }
      if (f.clean && rec.slipApplied && rec.undo) { Object.assign(y, { start: rec.undo.start, best: rec.undo.best, total: rec.undo.total }); y.slips = (y.slips || []).slice(0, -1); y.cel = 0; rec.slipApplied = false; rec.undo = null; undone = true; }
      if (!f.clean && f.mkPlan && rec.lesson && rec.trig[0] && !(y.plans || []).some((pl: any) => pl.when === rec.trig[0] && pl.then === rec.lesson)) y.plans.push({ when: rec.trig[0], then: rec.lesson });
      L[dk] = rec;
    });
    router.back();
    if (slipNow) setTimeout(() => openGrace(S.rec.trackers.find((z: any) => z.id === x.id), rec), 350);
    else toast(undone ? 'Slip removed. Your counter is back.' : rec.journal ? 'Check-in saved. Your note is in My journal.' : (f.clean ? 'Check-in saved. Well done today.' : 'Check-in saved'));
  };
  const pick = (v: boolean, bg: string, fg: string, icon: string, label: string) => { const on = f.clean === v; return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => { tap(); set({ clean: v }); }} style={{ flex: 1, minHeight: 92, borderRadius: 26, padding: 16, justifyContent: 'space-between', backgroundColor: on ? bg : c.surface, borderWidth: 2, borderColor: on ? bg : c.line }}>
      <Icon name={icon} color={on ? fg : c.ink} /><Txt w={700} size={16} color={on ? fg : undefined}>{label}</Txt>
    </Pressable>); };
  return (
    <Page title={past ? fmtDate(keyDate(dk), { month: 'long', day: 'numeric' }) : t('Today’s check-in')}>
      <Title a="How did" b={past ? 'that day go?' : 'today go?'} style={{ marginTop: 6, marginBottom: 20 }} />
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>{pick(true, '#23C25F', '#06341B', 'check', 'I stayed free')}{pick(false, '#FFB0D4', '#4A0A14', 'heart', 'I slipped')}</View>
      {f.clean === false ? <>
        <OkMsg title={ex && ex.clean === false ? undefined : t('Thank you for being honest.')} body={t('A slip is not the end of the road. Your free days still count, and His mercies are new tomorrow morning.')} />
        <Txt w={600} size={14} style={{ marginBottom: 10 }}>{t('What led to it?') + ' '}<Txt muted size={14} w={500}>(choose any)</Txt></Txt>
        <Chips style={{ marginBottom: 18 }}>{tl.map(tg => <Chip key={tg} label={tg} on={f.trig.includes(tg)} onPress={() => set({ trig: f.trig.includes(tg) ? f.trig.filter((z: string) => z !== tg) : [...f.trig, tg] })} />)}</Chips>
        <Field label="What could you do differently next time?"><Input multi minH={80} value={f.lesson} onChangeText={v => set({ lesson: v })} placeholder={f.trig[0] && PLAN_SUG[f.trig[0]] ? PLAN_SUG[f.trig[0]] : 'Call someone, leave the room, go for a walk…'} /></Field>
        {f.trig.length ? <SetRow title="Save as an if-then plan" sub={t('When') + ' “' + t(f.trig[0]) + '”, ' + t('I will do this')} right={<Switch value={f.mkPlan} a11y="Save as an if-then plan" onChange={v => set({ mkPlan: v })} />} /> : null}
      </> : f.clean === true ? <>
        <Txt w={600} size={14} style={{ marginBottom: 10 }}>{t('Did anything make it harder?') + ' '}<Txt muted size={14} w={500}>(optional)</Txt></Txt>
        <Chips style={{ marginBottom: 18 }}>{tl.slice(0, 12).map(tg => <Chip key={tg} label={tg} on={f.trig.includes(tg)} onPress={() => set({ trig: f.trig.includes(tg) ? f.trig.filter((z: string) => z !== tg) : [...f.trig, tg] })} />)}</Chips>
      </> : null}
      <Field label={t(past ? 'Cravings that day:' : 'Cravings today:') + ' ' + f.crave + ' ' + t('out of 10')}>
        <Slider minimumValue={0} maximumValue={10} step={1} value={f.crave} onValueChange={v => set({ crave: Math.round(v) })} minimumTrackTintColor={c.accent} maximumTrackTintColor={c.line} thumbTintColor={c.accent} />
      </Field>
      <Txt w={600} size={14} style={{ marginBottom: 10 }}>{t('I feel') + ' '}<Txt muted size={14} w={500}>(choose any)</Txt></Txt>
      <Chips style={{ marginBottom: 22 }}>{RMOODS.map(m => <Chip key={m} label={m} on={f.mood.includes(m)} onPress={() => set({ mood: f.mood.includes(m) ? f.mood.filter((z: string) => z !== m) : [...f.mood, m] })} />)}</Chips>
      <Txt w={700} size={21}>Questions for you</Txt>
      <Txt muted size={14} style={{ marginBottom: 14 }}>Based on your recent check-ins</Txt>
      {f.qs.map((q: string, i: number) => <Field key={i} label={q}><Input multi minH={90} value={f.answers[i] || ''} onChangeText={v => { const a = f.answers.slice(); a[i] = v; set({ answers: a }); }} placeholder="Write a sentence or two" /></Field>)}
      <View style={{ padding: 16, borderRadius: 22, backgroundColor: c.surface, marginBottom: 12 }}><Txt w={700} size={17}>Leave a note</Txt><Txt muted size={14}>{past ? 'Anything you want to remember about that day.' : 'Anything you want to remember about today.'}</Txt></View>
      <Input multi minH={110} value={f.journal} onChangeText={v => set({ journal: v })} placeholder="A short note for today" />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}><Icon name="journal" size={16} color={c.muted} /><Txt muted size={13.5} style={{ flex: 1 }}>Your notes are kept in My journal, under Check-in notes.</Txt></View>
      <Btn kind="primary" block style={{ marginTop: 16 }} label={ex ? 'Update check-in' : 'Save check-in'} onPress={save} />
    </Page>
  );
}
