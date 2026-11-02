/* Goal block (Today), goal editor sheet, and the prayer calendar. */
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { S, mutate, Goal, useStore } from '../lib/store';
import { DNAMES, THEMES, TCOL } from '../lib/content';
import { affFor, countdown, dayInitials, goalById, isPlus, nextOcc, pevery, prayedToggle, shareTextFor, streakOf, themeFor, toggleSaved, doneDays, dayShort } from '../lib/affirm';
import { passage, refLabel } from '../lib/bible';
import { phTheme } from '../lib/content';
import { dateKey, hash, periodNum } from '../lib/util';
import { fmtDate, fmtTime, refShow, t } from '../lib/i18n';
import { openRef } from '../screens/bibleNav';
import { shareText, openCard } from '../lib/share';
import { Btn, Chip, Chips, Field, IconBtn, Input, Seg, Txt, useC, tap } from '../ui/kit';
import { Icon } from '../ui/Icon';
import { closeSheet, openSheet, SheetTitle, toast } from '../ui/overlay';
import { AffCard } from './blocks';
import { TimeField } from './TimeField';
import { requestPerm, notifState } from '../lib/notify';
import { useTick } from '../lib/hooks';

function Act({ icon, label, on, onPress }: { icon: string; label: string; on?: boolean; onPress: () => void }) {
  const c = useC();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!on }} onPress={() => { tap(); onPress(); }} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
      <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: on ? '#FFB0D4' : c.surface2, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} color={on ? '#4A0A14' : c.ink} fill={on && icon === 'heart'} />
      </View>
      <Txt w={500} size={12.5} muted>{label}</Txt>
    </Pressable>
  );
}
export { Act };

export function GoalBlock({ g }: { g: Goal }) {
  const c = useC(); useTick(15000);
  const now = new Date(), it = affFor(g, now), ref = refLabel(it.r), vt = passage(it.r), k = themeFor(g);
  const isSaved = S.saved.some(s => s.id === it.id), done = !!(S.done[g.id] && S.done[g.id][dateKey(now)]), st = streakOf(g.id), nx = nextOcc(g);
  const sub = g.id === '_' ? t('A fresh word every day') : (g.theme === 'any' ? t('Mixed focus') : t(g.theme)) + ', ' + pevery(g.period);
  return (
    <View style={{ marginBottom: 40 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <View style={{ flex: 1 }}><Txt w={700} size={21} lh={1.15} ls={-0.02}>{g.name}</Txt><Txt muted size={14} tr={false}>{sub}</Txt></View>
        {g.time ? <View style={{ alignItems: 'flex-end', paddingVertical: 7, paddingHorizontal: 14, borderRadius: 18, backgroundColor: c.surface2 }}>
          <Txt w={700} size={15} tr={false}>{fmtTime(g.time)}</Txt>
          <Txt muted size={12.5} tr={false}>{g.on && nx ? countdown(nx) : g.on ? '' : t('Reminders off')}</Txt>
        </View> : null}
      </View>
      <AffCard k={k} v={hash(it.id)} photo={phTheme(it.t, hash(it.id))} seed={hash(it.id)} tag={it.t} onGo={() => openRef(ref)} goA11y={'Read ' + ref + ' in the Bible'} aff={t(it.a)} verse={vt} refText={refShow(ref)} />
      <View style={{ flexDirection: 'row', gap: 4, marginTop: 16 }}>
        <Act icon="heart" label={isSaved ? 'Saved' : 'Save'} on={isSaved} onPress={() => { const on = toggleSaved({ id: it.id, a: it.a, ref }); toast(on ? 'Saved' : 'Removed from Saved'); }} />
        <Act icon="share" label="Share" onPress={() => shareText(shareTextFor(t(it.a), vt, ref))} />
        <Act icon="image" label="Card" onPress={() => openCard({ aff: t(it.a), text: vt, ref, label: t(it.t), key: k, v: hash(it.id) })} />
        <Act icon="shuffle" label="Another" onPress={() => mutate(s => { const sk = g.id + ':' + periodNum(g.period, new Date()); s.shifts[sk] = (s.shifts[sk] || 0) + 1; })} />
      </View>
      {g.id === '_' ? null : (
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 16 }}>
          <Btn kind={done ? 'leaf' : 'primary'} icon="check" label={done ? 'Done for today' : 'I prayed today'} style={{ flex: 1 }} onPress={() => { if (prayedToggle(g.id)) toast('Well done. Peace be with you.'); }} />
          {st ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 52, paddingHorizontal: 16, borderRadius: 999, backgroundColor: c.surface2 }}>
            <Icon name="flame" size={18} color="#FF8A5B" fill /><Txt w={600} size={14.5}>{st + (st === 1 ? ' day' : ' days')}</Txt>
          </View> : null}
        </View>
      )}
    </View>
  );
}

/* ---------- goal editor ---------- */
export function openGoalEditor(g?: Goal | null, tpl?: Partial<Goal>) { openSheet(<GoalEditor g={g || null} tpl={tpl} />); }
function GoalEditor({ g, tpl }: { g: Goal | null; tpl?: Partial<Goal> }) {
  useStore();
  const d0: Goal = g ? { ...g } : Object.assign({ id: '', name: '', theme: 'Faith', period: 'day', time: '06:30', days: [0, 1, 2, 3, 4, 5, 6], on: true }, tpl || {});
  const [d, setD] = useState<Goal>(d0);
  const set = (p: Partial<Goal>) => setD(x => ({ ...x, ...p }));
  const save = () => {
    if (!d.days.length) { toast('Pick at least one day'); return; }
    const name = d.name.trim() || (d.theme === 'any' ? t('My quiet time') : t(d.theme));
    mutate(s => { if (d.id) { const x = s.goals.find(y => y.id === d.id); if (x) Object.assign(x, { ...d, name }); } else s.goals.push({ ...d, name, id: 'g' + Date.now().toString(36), on: true }); });
    closeSheet(); toast('Goal saved');
    if (notifState() === 'undetermined') requestPerm();
  };
  return (
    <View>
      <SheetTitle>{g ? 'Edit goal' : 'New goal'}</SheetTitle>
      <Field label="Goal name"><Input value={d.name} maxLength={40} placeholder="For example, Grow in faith" onChangeText={v => set({ name: v })} /></Field>
      <Field label="Focus"><Chips>{[...THEMES, 'any'].map(th => <Chip key={th} label={th === 'any' ? 'Surprise me' : th} on={d.theme === th} onPress={() => set({ theme: th })} />)}</Chips></Field>
      <Field label="Get a new affirmation every"><Seg options={[['day', 'Day'], ['week', 'Week'], ['month', 'Month'], ['year', 'Year']]} value={d.period} onChange={v => set({ period: v })} /></Field>
      <Field label="Time you pray or meditate"><TimeField value={d.time || '06:30'} onChange={v => set({ time: v })} /></Field>
      <Field label="Days"><DayDots days={d.days} onChange={days => set({ days })} /></Field>
      <Txt muted size={14} style={{ marginTop: -6, marginBottom: 18 }}>Selah reminds you 30 minutes before and again at this time.</Txt>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {g ? <Btn kind="danger" label="Delete" style={{ flex: 1 }} onPress={() => { mutate(s => { s.goals = s.goals.filter(x => x.id !== g.id); }); closeSheet(); toast('Goal deleted'); }} /> : null}
        <Btn kind="primary" label="Save goal" style={{ flex: 1 }} onPress={save} />
      </View>
    </View>
  );
}
export function DayDots({ days, onChange }: { days: number[]; onChange: (d: number[]) => void }) {
  const ini = dayInitials();
  return (
    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
      {DNAMES.map((n, i) => { const on = days.includes(i); return <Chip key={i} label={ini[i]} tr={false} a11y={dayShort(i)} on={on} style={{ width: 44, height: 44, minHeight: 44, paddingHorizontal: 0 }} onPress={() => onChange(on ? days.filter(x => x !== i) : [...days, i].sort())} />; })}
    </View>
  );
}

/* ---------- prayer calendar (Goals tab) ---------- */
export function PrayerCalendar() {
  const c = useC(); const [off, setOff] = useState(0); useStore();
  const now = new Date(), m = new Date(now.getFullYear(), now.getMonth() + off, 1), mo = m.getMonth();
  const dd = doneDays(); const first = (m.getDay() + 6) % 7, dim = new Date(m.getFullYear(), mo + 1, 0).getDate(), weeks = Math.ceil((first + dim) / 7);
  const cells: { d: Date; out: boolean; dn: boolean; today: boolean }[] = []; let cnt = 0;
  for (let i = 0; i < weeks * 7; i++) { const d = new Date(m.getFullYear(), mo, 1 - first + i), k = dateKey(d), out = d.getMonth() !== mo, dn = dd.has(k); if (dn && !out) cnt++; cells.push({ d, out, dn, today: k === dateKey(now) }); }
  const wd = [1, 2, 3, 4, 5, 6, 0].map(i => fmtDate(new Date(2026, 1, 1 + i), { weekday: 'short' }));
  return (
    <View style={{ backgroundColor: c.surface, borderRadius: 30, padding: 16, paddingTop: 18, marginTop: 28 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 12, paddingLeft: 4 }}>
        <View style={{ flex: 1 }}>
          <Txt w={700} size={24} lh={1.1} ls={-0.025} tr={false}>{fmtDate(m, { month: 'long', year: 'numeric' })}</Txt>
          <Txt muted size={14}>{cnt ? `Prayed on ${cnt} day${cnt === 1 ? '' : 's'}` : 'No prayers logged yet'}</Txt>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <IconBtn name="chevl" a11y="Previous month" onPress={() => setOff(off - 1)} />
          <IconBtn name="chevr" a11y="Next month" onPress={() => off < 0 && setOff(off + 1)} style={{ opacity: off >= 0 ? 0.35 : 1 }} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {wd.map((w, i) => <View key={'w' + i} style={{ width: '14.2857%', alignItems: 'center', paddingBottom: 4 }}><Txt muted size={12} tr={false}>{w}</Txt></View>)}
        {cells.map((x, i) => (
          <View key={i} style={{ width: '14.2857%', alignItems: 'center', paddingVertical: 3 }}>
            <View style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: x.dn ? '#B6AEFF' : 'transparent', borderWidth: x.today ? 1.5 : 0, borderStyle: 'dashed', borderColor: c.ink, opacity: x.out ? 0.35 : 1 }}>
              <Txt w={x.dn ? 700 : 500} size={15} color={x.dn ? '#1E1446' : undefined} tr={false}>{String(x.d.getDate())}</Txt>
            </View>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 12, paddingLeft: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#B6AEFF' }} /><Txt muted size={13}>Prayed</Txt></View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><View style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.ink }} /><Txt muted size={13}>Today</Txt></View>
      </View>
    </View>
  );
}
export { goalById, TCOL, isPlus };
