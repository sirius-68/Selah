import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mutate } from '@/lib/store';
import { KINDS, REASON_SUG, TRIG_BASE, TRIG_KIND } from '@/lib/content';
import { passageOf } from '@/lib/bible';
import { numIn, todayK } from '@/lib/util';
import { refShow, t } from '@/lib/i18n';
import { requestPerm, notifState } from '@/lib/notify';
import { Block, BTag, Btn, Chip, Chips, Field, IconBtn, Input, OkMsg, SetRow, Seg, Switch, Title, Txt, useC, Lead } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { toast } from '@/ui/overlay';
import { TimeField, DateTimeField } from '@/features/TimeField';
import { HoldButton } from '@/features/freeUI';

const STEPS = ['what', 'when', 'why', 'triggers', 'cost', 'support', 'pledge'];
export default function Wizard() {
  const c = useC(); const ins = useSafeAreaInsets(); const p = useLocalSearchParams<{ k?: string }>();
  const [w, setW] = useState<any>(() => ({ step: p.k ? 1 : 0, kind: p.k || 'other', label: p.k && p.k !== 'other' ? t(KINDS[p.k].n) : '', when: 'now', start: null, reasons: [], why: '', triggers: [], discreet: false, cost: '', hours: '', sname: '', sphone: '', remind: '08:00', remind2: '21:00' }));
  const set = (q: any) => setW((x: any) => ({ ...x, ...q }));
  const st = STEPS[w.step], K = KINDS[w.kind] || KINDS.other, tot = STEPS.length;
  const next = (skip?: boolean) => {
    const q: any = {};
    if (skip) { if (st === 'why') { q.reasons = []; q.why = ''; } if (st === 'triggers') q.triggers = []; if (st === 'cost') { q.cost = ''; q.hours = ''; } }
    if (st === 'when' && w.when === 'earlier') { if (!w.start) { toast('Pick when you last gave in to it'); return; } if (w.start > Date.now()) { toast('Pick a time in the past'); return; } }
    set({ ...q, step: Math.min(tot - 1, w.step + 1) });
  };
  const commit = () => {
    const start = w.when === 'earlier' && w.start && w.start <= Date.now() ? w.start : Date.now();
    const reasons = [...w.reasons.map((r: string) => t(r))]; if ((w.why || '').trim()) reasons.unshift(w.why.trim());
    const id = 't' + Date.now().toString(36);
    mutate(s => {
      s.rec.trackers.push({ id, kind: w.kind, label: (w.label || '').trim() || t(KINDS[w.kind].n), discreet: !!w.discreet, reasons, why: reasons[0] || '', triggers: [...w.triggers], plans: [], cost: numIn(w.cost), hours: numIn(w.hours), sname: (w.sname || '').trim(), sphone: (w.sphone || '').trim(), remind: w.remind || '', remind2: w.remind2 || '', start, first: start, created: Date.now(), best: 0, total: 0, slips: [], cel: 0 });
      s.rec.logs[id] = { [todayK()]: { tasks: {}, partial: true, pledge: Date.now() } };
    });
    if ((w.remind || w.remind2) && notifState() === 'undetermined') requestPerm();
    toast('Your journey starts now'); router.replace({ pathname: '/free', params: { id } });
  };
  let body: React.ReactNode = null, skip = false, nextLbl: string | null = 'Continue';
  if (st === 'what') body = <>
    <Title a="What are you" b="leaving behind?" style={{ marginBottom: 18 }} />
    <Chips>{Object.entries(KINDS).map(([k, x]) => <Chip key={k} label={x.n} on={w.kind === k} onPress={() => set({ kind: k, label: !w.label || w.label === t(KINDS[w.kind].n) ? (k === 'other' ? '' : t(x.n)) : w.label })} />)}</Chips>
    <Field label="Name on screen" style={{ marginTop: 20 }}><Input value={w.label} maxLength={30} onChangeText={v => set({ label: v })} placeholder={K.n === 'Something else' ? 'For example, Sugar' : K.n} /></Field>
    <SetRow title="Discreet mode" sub="Show “Private tracker” instead of the name on shared screens" right={<Switch value={!!w.discreet} a11y="Discreet mode" onChange={v => set({ discreet: v })} />} />
    {K.med ? <OkMsg warn title={t('Check with a doctor first')} body={t(`Stopping ${w.kind === 'alcohol' ? 'alcohol' : 'some drugs'} suddenly after heavy or long-term use can cause dangerous withdrawal. A doctor can help you quit safely.`)} /> : null}
  </>;
  if (st === 'when') body = <>
    <Title a="When did you" b="last give in?" />
    <Lead>Your counter starts from this moment.</Lead>
    <Seg options={[['now', 'Starting now'], ['earlier', 'Earlier']]} value={w.when} onChange={v => set({ when: v, start: v === 'earlier' ? (w.start || Date.now() - 86400000) : null })} />
    {w.when === 'earlier' ? <View style={{ marginTop: 10 }}><DateTimeField value={w.start} onChange={ms => set({ start: ms })} /></View> : null}
  </>;
  if (st === 'why') { skip = true; body = <>
    <Title a="Why do you" b="want to be free?" />
    <Lead>Pick any that are true, or write your own. We’ll show them when a craving hits.</Lead>
    <Chips>{REASON_SUG.map(r => <Chip key={r} label={r} on={w.reasons.includes(r)} onPress={() => set({ reasons: w.reasons.includes(r) ? w.reasons.filter((x: string) => x !== r) : [...w.reasons, r] })} />)}</Chips>
    <Field label="In my own words (optional)" style={{ marginTop: 18 }}><Input multi value={w.why} maxLength={200} onChangeText={v => set({ why: v })} placeholder="For my kids. For my health. Because I want to be free." /></Field>
  </>; }
  if (st === 'triggers') { skip = true; body = <>
    <Title a="What usually" b="sets it off?" />
    <Lead>Knowing your triggers is half the battle. Tap any you recognise.</Lead>
    <Chips>{[...TRIG_BASE, ...(TRIG_KIND[w.kind] || [])].map(x => <Chip key={x} label={x} on={w.triggers.includes(x)} onPress={() => set({ triggers: w.triggers.includes(x) ? w.triggers.filter((y: string) => y !== x) : [...w.triggers, x] })} />)}</Chips>
  </>; }
  if (st === 'cost') { skip = true; body = <>
    <Title a="What did it" b="cost you?" />
    <Lead>Optional. We’ll show the money and time you win back.</Lead>
    <Field label="Money per day"><Input value={w.cost} onChangeText={v => set({ cost: v })} keyboardType="decimal-pad" placeholder="0.00" /></Field>
    <Field label="Hours per day"><Input value={w.hours} onChangeText={v => set({ hours: v })} keyboardType="decimal-pad" placeholder="0" /></Field>
  </>; }
  if (st === 'support') { skip = true; body = <>
    <Title a="Who’s in your" b="corner?" />
    <Lead>Someone you can call or text when it’s hard. Only you see this.</Lead>
    <View style={{ flexDirection: 'row', gap: 10 }}><Input value={w.sname} onChangeText={v => set({ sname: v })} placeholder="Their name" style={{ flex: 1 }} /><Input value={w.sphone} onChangeText={v => set({ sphone: v })} keyboardType="phone-pad" placeholder="Phone number" style={{ flex: 1 }} /></View>
    <Txt w={600} size={14} style={{ marginTop: 24, marginBottom: 10 }}>Daily reminders</Txt>
    <Field label="Morning pledge"><TimeField value={w.remind} allowEmpty placeholder="Off" onChange={v => set({ remind: v })} /></Field>
    <Field label="Evening check-in"><TimeField value={w.remind2} allowEmpty placeholder="Off" onChange={v => set({ remind2: v })} /></Field>
  </>; }
  if (st === 'pledge') { nextLbl = null; body = <>
    <Title a="Make your" b="first pledge." style={{ marginBottom: 6 }} />
    <Block k="dusk" v={4} style={{ padding: 22, paddingBottom: 24, marginTop: 6 }}>
      <BTag label="Today" />
      <Txt w={700} size={28} lh={1.08} style={{ paddingTop: 150 }}>I choose freedom today. Not forever, just today, with God’s help.</Txt>
      <Txt size={16} lh={1.5} tr={false} style={{ marginTop: 14, opacity: 0.86 }}>{'“' + passageOf('Galatians 5:1') + '”'}</Txt>
      <Txt w={700} size={14} tr={false} style={{ marginTop: 12 }}>{refShow('Galatians 5:1')}</Txt>
    </Block>
    <HoldButton label="Press and hold to commit" onDone={commit} />
  </>; }
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: ins.top + 12, paddingBottom: 12, paddingHorizontal: 16 }}>
        <IconBtn name={w.step ? 'chevl' : 'x'} a11y={w.step ? 'Back' : 'Close'} onPress={() => w.step ? set({ step: w.step - 1 }) : router.back()} />
        <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: c.surface2, overflow: 'hidden' }}><View style={{ width: `${Math.round((w.step + 1) / tot * 100)}%`, height: '100%', backgroundColor: '#F4F01E' }} /></View>
        <Txt muted w={600} size={14} tr={false}>{(w.step + 1) + '/' + tot}</Txt>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 130 + ins.bottom, paddingTop: 10 }}>{body}</ScrollView>
      {nextLbl ? <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16 + ins.bottom, backgroundColor: c.bg }}>
        {skip ? <Btn label="Skip" style={{ flex: 1 }} onPress={() => next(true)} /> : null}
        <Btn kind="primary" label={nextLbl} style={{ flex: 2 }} onPress={() => next()} />
      </View> : null}
    </View>
  );
}
