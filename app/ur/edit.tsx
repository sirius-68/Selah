import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useStore, mutate } from '@/lib/store';
import { SCAPES, SCP, URV, WATCHES } from '@/lib/content';
import { parseRef, passage, refLabel } from '@/lib/bible';
import { isPlus } from '@/lib/affirm';
import { plName, urItem, urVerses } from '@/lib/ur';
import { fmtTime, locRefs, t } from '@/lib/i18n';
import { myTracks, pickTracks } from '@/lib/tracks';
import { Page, toast } from '@/ui/overlay';
import { Btn, Chip, Chips, Field, IconBtn, Input, SetRow, Switch, Txt, useC } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { DayDots } from '@/features/goals';
import { TimeField } from '@/features/TimeField';
import { requestPerm, notifState } from '@/lib/notify';
import { suspendLock } from '@/features/lock';

export default function UrEdit() {
  useStore(); const c = useC();
  const p = useLocalSearchParams<{ k?: string; id?: string }>(); const kind = p.k === 'watch' ? 'watch' : 'session';
  const [d, setD] = useState<any>(() => {
    const src = p.id ? urItem(kind, p.id) : null;
    const x: any = src ? JSON.parse(JSON.stringify(src)) : { name: '', themes: kind === 'watch' ? ['Warfare', 'Intercession'] : ['Faith'], custom: [], gen: [], scrOn: true, every: 2, playlist: [{ t: 'scape', id: kind === 'watch' ? 'deep' : 'hymn' }], target: 0, time: '03:00', days: [0, 1, 2, 3, 4, 5, 6], dur: 60, on: true };
    if (src && !src.verses && !src.gen) { x.custom = urVerses(src); x.gen = []; } if (src && src.verses && !src.gen) { x.custom = src.verses.slice(); x.gen = []; } x.gen = x.gen || []; x.custom = x.custom || []; delete x.verses;
    return x;
  });
  const [ref, setRef] = useState(''); const [armed, setArmed] = useState(false);
  const set = (q: any) => setD((x: any) => ({ ...x, ...q }));
  const w = kind === 'watch', vs = urVerses(d);
  const sounds = SCAPES.map(s => ({ t: 'scape', id: s.id, n: t(s.n), lock: !s.free && !isPlus() })).concat(myTracks().map(m => ({ t: 'my', id: m.id, n: m.name, lock: !isPlus() })));
  const addRefs = () => {
    const raw = ref.trim(); if (!raw) { toast('Type a verse first, like Isaiah 40:31'); return; }
    const parts = raw.split(/[;\n]+|,\s*(?=(?:[1-3]\s*)?[A-Za-zÀ-ÿА-яЁё])/).map(s => s.trim()).filter(Boolean); const bad: string[] = []; let added = 0; const custom = d.custom.slice();
    parts.forEach(v => { const r = parseRef(v); if (!r || !r.hasC) { bad.push(v); return; } if (!r.v1) r.v1 = 1; const lab = refLabel(r); if (!custom.includes(lab) && !d.gen.includes(lab)) { custom.push(lab); added++; } });
    set({ custom }); setRef(bad.join('; '));
    if (bad.length) toast(bad.length === 1 ? 'Couldn’t find that verse. Try a reference like Isaiah 40:31.' : `Couldn’t find ${bad.length} of those. Try a reference like Isaiah 40:31.`); else if (added) toast(added === 1 ? 'Scripture added' : added + ' scriptures added');
  };
  const gen = () => { if (!d.themes.length) { toast('Pick a theme first'); return; } const pick: string[] = []; d.themes.forEach((th: string) => { const pool = (URV[th] || []).filter(r => !d.custom.includes(r) && !pick.includes(r)); for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; } pick.push(...pool.slice(0, 3)); }); set({ gen: pick }); toast(`${pick.length} scriptures generated from ${d.themes.length === 1 ? d.themes[0].toLowerCase() : 'your themes'}`); };
  const save = () => {
    const name = (d.name || '').trim(); if (!name) { toast('Give it a name'); return; }
    if (!urVerses(d).length) { toast('Add a scripture, or tap Generate from my themes'); return; }
    if (w && !d.days.length) { toast('Pick at least one day'); return; }
    const rec: any = { id: d.id || ('u' + Date.now().toString(36)), name, themes: d.themes, custom: d.custom, gen: d.gen || [], verses: urVerses(d), scrOn: d.scrOn, every: d.every, playlist: d.playlist, target: d.target || 0 };
    if (w) Object.assign(rec, { time: d.time || '03:00', days: d.days, dur: d.dur, on: d.on });
    mutate(s => { const list = w ? s.ur.watches : s.ur.sessions, i = list.findIndex((x: any) => x.id === rec.id); if (i >= 0) list[i] = rec; else list.push(rec); });
    if (w && d.on && notifState() === 'undetermined') requestPerm();
    toast(w ? 'Prayer watch saved' : 'Prayer session saved'); router.back();
  };
  return (
    <Page title={d.id ? (w ? 'Edit watch' : 'Edit session') : (w ? 'New prayer watch' : 'New prayer session')}>
      <Field label="Name"><Input value={d.name} maxLength={40} placeholder={w ? 'For example, Fourth watch' : 'For example, Morning warfare'} onChangeText={v => set({ name: v })} /></Field>
      {w ? <>
        <Field label="Watch of the night"><Chips>{WATCHES.map(([n, tm]) => <Chip key={n} tr={false} label={t(n) + ', ' + fmtTime(tm)} on={d.time === tm} onPress={() => set({ time: tm, name: !d.name || WATCHES.some(([x]) => t(x) === d.name || x === d.name) ? t(n) : d.name })} />)}</Chips></Field>
        <Field label="Start time"><TimeField value={d.time || '03:00'} onChange={v => set({ time: v })} /></Field>
        <SetRow title="Reminders" sub="10 minutes before, and when the watch begins" right={<Switch value={d.on} a11y="Reminders" onChange={v => set({ on: v })} />} />
        <Field label="Days"><DayDots days={d.days} onChange={days => set({ days })} /></Field>
        <Field label="Length"><Chips>{[15, 30, 60, 90, 120, 180].map(m => <Chip key={m} label={m < 60 ? m + ' min' : m / 60 + ' h'} on={d.dur === m} onPress={() => set({ dur: m })} />)}</Chips></Field>
      </> : (
        <Field label="Length" hint="A gentle chime when time is up. Keep praying as long as you like."><Chips>{[[0, 'Open'], [10, '10 min'], [20, '20 min'], [30, '30 min'], [60, '1 h']].map(([m, l]) => <Chip key={m} label={l as string} on={d.target === m} onPress={() => set({ target: m })} />)}</Chips></Field>
      )}
      <Field label="Prayer themes"><Chips>{Object.keys(URV).map(th => <Chip key={th} label={th} on={d.themes.includes(th)} onPress={() => set({ themes: d.themes.includes(th) ? d.themes.filter((x: string) => x !== th) : [...d.themes, th] })} />)}</Chips></Field>
      <Field label="Scriptures">
        <View>
          <Input value={ref} onChangeText={setRef} placeholder="Type a verse, like Isaiah 40:31" autoCorrect={false} onSubmitEditing={addRefs} returnKeyType="done" style={{ paddingRight: 76 }} />
          <Pressable onPress={addRefs} style={{ position: 'absolute', right: 8, top: 8, height: 36, paddingHorizontal: 12, justifyContent: 'center' }}><Txt w={700} color={c.accent}>Add</Txt></Pressable>
        </View>
        <Txt muted size={13.5} style={{ marginTop: 8, marginBottom: 12 }}>Add several at once by separating them with semicolons, like John 3:16; Psalm 23:1.</Txt>
        <Btn icon="spark" label={(d.gen || []).length ? 'Generate again from my themes' : 'Generate from my themes'} disabled={!d.themes.length} onPress={gen} />
        {vs.length ? <View style={{ gap: 8, marginTop: 12 }}>{vs.map(r => { const pr = parseRef(r), g = d.gen.includes(r) && !d.custom.includes(r), tx = pr ? passage(pr) : ''; return (
          <View key={r} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 18, backgroundColor: c.surface }}>
            <View style={{ flex: 1 }}><Txt w={700} size={15} tr={false}>{locRefs(r)}</Txt><Txt muted size={13} tr={false} numberOfLines={2}>{tx.slice(0, 90) + (tx.length > 90 ? '…' : '')}</Txt></View>
            {g ? <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: '#B6AEFF' }}><Txt w={700} size={11} color="#1E1446">Generated</Txt></View> : null}
            <IconBtn name="x" size={36} a11y={'Remove ' + r} onPress={() => set({ custom: d.custom.filter((x: string) => x !== r), gen: d.gen.filter((x: string) => x !== r) })} />
          </View>); })}
          <Txt muted size={13.5}>{vs.length + (vs.length === 1 ? ' scripture' : ' scriptures') + '. They play in this order and repeat.'}</Txt></View>
          : <Txt muted size={13.5} style={{ marginTop: 12 }}>No scriptures yet. Type your own, or pick themes and tap Generate.</Txt>}
      </Field>
      <SetRow title="Scripture playback" sub="Read verses aloud during prayer. You can also switch it off mid-prayer." right={<Switch value={d.scrOn} a11y="Scripture playback" onChange={v => set({ scrOn: v })} />} />
      {d.scrOn ? <Field label="Read a verse every"><Chips>{[1, 2, 3, 5, 10].map(m => <Chip key={m} label={m + ' min'} on={d.every === m} onPress={() => set({ every: m })} />)}</Chips></Field> : null}
      <Field label="Music playlist">
        {d.playlist.length ? <View style={{ gap: 6, marginBottom: 10 }}>{d.playlist.map((it: any, i: number) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, paddingLeft: 14, borderRadius: 18, backgroundColor: c.surface }}>
            <Txt w={700} muted tr={false}>{String(i + 1)}</Txt><Txt style={{ flex: 1 }} tr={false} numberOfLines={1}>{plName(it)}</Txt>
            <IconBtn name="chevl" size={34} a11y="Move up" style={{ opacity: i ? 1 : 0.3, transform: [{ rotate: '90deg' }] }} onPress={() => { if (!i) return; const pl = d.playlist.slice(); [pl[i - 1], pl[i]] = [pl[i], pl[i - 1]]; set({ playlist: pl }); }} />
            <IconBtn name="x" size={34} a11y="Remove" onPress={() => set({ playlist: d.playlist.filter((_: any, j: number) => j !== i) })} />
          </View>))}</View> : <Txt muted size={13.5} style={{ marginBottom: 10 }}>No music yet. Tap a sound to add it. Tracks play in order and loop.</Txt>}
        <Chips>
          {sounds.map(s => <Chip key={s.t + s.id} tr={false} icon={s.lock ? 'lock' : 'plus'} label={s.n} onPress={() => { if (s.lock) { router.push('/paywall'); toast('This sound comes with Selah Plus'); return; } set({ playlist: [...d.playlist, { t: s.t, id: s.id }] }); }} />)}
          <Chip icon={isPlus() ? 'plus' : 'lock'} label="Upload your own" onPress={async () => { if (!isPlus()) { router.push('/paywall'); toast('Uploading your own audio comes with Selah Plus'); return; } suspendLock(); const r = await pickTracks(); r.msgs.forEach(m => toast(m)); if (r.ids.length) { set({ playlist: [...d.playlist, ...r.ids.map(id => ({ t: 'my', id }))] }); toast(r.ids.length === 1 ? 'Sound uploaded and added to the playlist' : r.ids.length + ' sounds uploaded and added'); } }} />
        </Chips>
      </Field>
      <Btn kind="primary" block label={d.id ? 'Save changes' : w ? 'Save watch' : 'Save session'} onPress={save} />
      {d.id ? <Btn kind="danger" block style={{ marginTop: 10 }} label={armed ? 'Tap again to delete' : 'Delete ' + (w ? 'watch' : 'session')} onPress={() => { if (!armed) { setArmed(true); return; } mutate(s => { if (w) s.ur.watches = s.ur.watches.filter((x: any) => x.id !== d.id); else s.ur.sessions = s.ur.sessions.filter((x: any) => x.id !== d.id); }); toast('Deleted'); router.back(); }} /> : null}
    </Page>
  );
}
