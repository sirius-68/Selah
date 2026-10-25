import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { mutate, useStore } from '@/lib/store';
import { KINDS } from '@/lib/content';
import { trk } from '@/lib/free';
import { numIn } from '@/lib/util';
import { t } from '@/lib/i18n';
import { Page, toast } from '@/ui/overlay';
import { Btn, Chip, Chips, Field, Input, OkMsg, SetRow, Switch, Title } from '@/ui/kit';
import { TimeField } from '@/features/TimeField';
import { requestPerm, notifState } from '@/lib/notify';

export default function Setup() {
  useStore(); const { id } = useLocalSearchParams<{ id: string }>(); const x = trk(id);
  const [s, setS] = useState<any>(() => x ? { kind: x.kind, label: x.label, discreet: !!x.discreet, cost: x.cost ? String(x.cost) : '', hours: x.hours ? String(x.hours) : '', sname: x.sname || '', sphone: x.sphone || '', remind: x.remind || '', remind2: x.remind2 || '' } : null);
  const [armed, setArmed] = useState(false);
  if (!x || !s) return <Page title=""><></></Page>;
  const set = (q: any) => setS((v: any) => ({ ...v, ...q })); const K = KINDS[s.kind] || KINDS.other;
  return (
    <Page title="Tracker settings">
      <Title a="Adjust your" b="tracker." style={{ marginTop: 6, marginBottom: 20 }} />
      <Field label="What are you leaving behind?"><Chips>{Object.entries(KINDS).map(([k, v]) => <Chip key={k} label={v.n} on={s.kind === k} onPress={() => set({ kind: k, label: !s.label || s.label === t(KINDS[s.kind].n) || s.label === KINDS[s.kind].n ? (k === 'other' ? '' : t(v.n)) : s.label })} />)}</Chips></Field>
      {K.med ? <OkMsg warn title={t('Check with a doctor first')} body={t(`Stopping ${s.kind === 'alcohol' ? 'alcohol' : 'some drugs'} suddenly after heavy or long-term use can cause dangerous withdrawal. A doctor can help you quit safely.`)} /> : null}
      <Field label="Name on screen"><Input value={s.label} maxLength={30} onChangeText={v => set({ label: v })} /></Field>
      <SetRow title="Discreet mode" sub="Show “Private tracker” instead of the name on shared screens" right={<Switch value={s.discreet} a11y="Discreet mode" onChange={v => set({ discreet: v })} />} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Field label="Money per day" style={{ flex: 1 }}><Input value={s.cost} onChangeText={v => set({ cost: v })} keyboardType="decimal-pad" placeholder="0.00" /></Field>
        <Field label="Hours per day" style={{ flex: 1 }}><Input value={s.hours} onChangeText={v => set({ hours: v })} keyboardType="decimal-pad" placeholder="0" /></Field>
      </View>
      <Field label="Support person (optional)"><View style={{ flexDirection: 'row', gap: 10 }}><Input value={s.sname} onChangeText={v => set({ sname: v })} placeholder="Their name" style={{ flex: 1 }} /><Input value={s.sphone} onChangeText={v => set({ sphone: v })} keyboardType="phone-pad" placeholder="Phone number" style={{ flex: 1 }} /></View></Field>
      <Field label="Morning pledge reminder"><TimeField value={s.remind} allowEmpty placeholder="Off" onChange={v => set({ remind: v })} /></Field>
      <Field label="Evening check-in reminder" hint="Leave a time empty to turn that reminder off."><TimeField value={s.remind2} allowEmpty placeholder="Off" onChange={v => set({ remind2: v })} /></Field>
      <Btn kind="primary" block label="Save changes" onPress={() => { mutate(st => { const y = st.rec.trackers.find((z: any) => z.id === id); Object.assign(y, { kind: s.kind, label: (s.label || '').trim() || t(KINDS[s.kind].n), discreet: !!s.discreet, cost: numIn(s.cost), hours: numIn(s.hours), sname: s.sname.trim(), sphone: s.sphone.trim(), remind: s.remind || '', remind2: s.remind2 || '' }); }); if ((s.remind || s.remind2) && notifState() === 'undetermined') requestPerm(); toast('Tracker updated'); router.back(); }} />
      <Btn kind="danger" block style={{ marginTop: 10 }} label={armed ? 'Tap again to delete this tracker and its journal' : 'Delete tracker'} onPress={() => { if (!armed) { setArmed(true); return; } mutate(st => { st.rec.trackers = st.rec.trackers.filter((z: any) => z.id !== id); delete st.rec.logs[id]; delete st.rec.urges[id]; }); toast('Tracker deleted'); router.dismissTo('/free' as any); }} />
    </Page>
  );
}
