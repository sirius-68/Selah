import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useStore, mutate } from '@/lib/store';
import { CT, PACK, QCOL } from '@/lib/content';
import { cmpKey, keyParts, passage, refLabel, verseRefOf } from '@/lib/bible';
import { affData, shareTextFor } from '@/lib/affirm';
import { keyDate } from '@/lib/util';
import { fmtDate, refShow, t } from '@/lib/i18n';
import { openRef } from '@/screens/bibleNav';
import { shareText, openCard } from '@/lib/share';
import { TabScreen } from '@/ui/TabScreen';
import { Chip, Chips, Empty, Mini, Title, Txt, useC } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { toast, go } from '@/ui/overlay';
import { openNote } from '@/features/bibleSheets';
import { frName } from '@/lib/free';

const F: [string, string][] = [['all', 'All'], ['aff', 'Affirmations'], ['marks', 'Bookmarks'], ['hl', 'Highlights'], ['notes', 'Notes'], ['journal', 'Journal']];
const HLC = ['#F4F01E', '#23C25F', '#B6AEFF', '#FFB0D4'];

export default function Saved() {
  const S = useStore(); const c = useC(); const [f, setF] = useState('all');
  const remove = (kind: string, id: string) => { mutate(s => { if (kind === 'aff') s.saved = s.saved.filter(x => x.id !== id); else if (kind === 'marks') s.marks = s.marks.filter(k => k !== id); else if (kind === 'hl') delete s.hl[id]; else if (kind === 'notes') delete s.notes[id]; }); toast('Removed'); };
  const out: React.ReactNode[] = [];
  if (f === 'all' || f === 'aff') [...S.saved].sort((a, b) => b.at - a.at).forEach((s, i) => {
    const d = affData(s), k = QCOL[i % QCOL.length], T = CT[k];
    out.push(
      <View key={'a' + s.id} style={{ borderRadius: 30, overflow: 'hidden', marginBottom: 14, backgroundColor: c.paper }}>
        <View style={{ backgroundColor: T.bg, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24, borderRadius: 30 }}>
          <View style={{ alignSelf: 'flex-start', minHeight: 28, paddingHorizontal: 12, borderRadius: 999, justifyContent: 'center', backgroundColor: T.t + '24' }}><Txt w={600} size={13} color={T.t}>{s.custom ? 'In my words' : 'Affirmation'}</Txt></View>
          <Txt w={700} size={24} lh={1.12} ls={-0.025} color={T.t} tr={!s.custom} style={{ marginTop: 12 }}>{s.a}</Txt>
        </View>
        <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14 }}>
          {d.text ? <Txt size={15.5} lh={1.5} color="#4E4459" tr={false}>{'“' + d.text + '”'}</Txt> : null}
          <Txt w={700} size={14} color="#17101F" tr={false} style={{ marginTop: 8, textDecorationLine: d.r ? 'underline' : 'none' }} onPress={d.r ? () => openRef(refLabel(d.r!)) : undefined}>{refShow(s.ref)}</Txt>
          <PaperMini items={[['share', 'Share', () => shareText(shareTextFor(t(d.aff), d.text, d.ref))], ['image', 'Card', () => openCard({ aff: s.custom ? d.aff : t(d.aff), text: d.text, ref: d.ref })], ['x', 'Remove', () => remove('aff', s.id)]]} />
        </View>
      </View>);
  });
  const vitem = (k: string, kind: string, dot: React.ReactNode) => { const r = verseRefOf(k), ref = refLabel(r);
    return (
      <View key={kind + k} style={{ backgroundColor: c.surface, borderRadius: 26, padding: 18, paddingBottom: 14, marginBottom: 12 }}>
        <Txt size={17} lh={1.55} serif={S.settings.read === 'serif'} tr={false}>{'“' + passage(r) + '”'}</Txt>
        <Pressable onPress={() => openRef(ref)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>{dot}<Txt w={700} size={14} tr={false} style={{ textDecorationLine: 'underline' }}>{refShow(ref)}</Txt></Pressable>
        <Mini items={[['share', 'Share', () => shareText(shareTextFor('', passage(r), ref))], ['image', 'Card', () => openCard({ text: passage(r), ref })], ['x', 'Remove', () => remove(kind, k)]]} />
      </View>); };
  if (f === 'all' || f === 'marks') S.marks.slice().sort(cmpKey).forEach(k => out.push(vitem(k, 'marks', <Icon name="bookmark" size={16} color={c.ink} fill />)));
  if (f === 'all' || f === 'hl') { const ks = Object.keys(S.hl).sort(cmpKey); ks.slice(0, 150).forEach(k => out.push(vitem(k, 'hl', <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: HLC[S.hl[k]] }} />))); if (ks.length > 150) out.push(<Txt key="more" muted size={14} center style={{ marginVertical: 8 }}>{`Showing the first 150 of ${ks.length} highlights.`}</Txt>); }
  if (f === 'all' || f === 'notes') Object.keys(S.notes).sort(cmpKey).forEach(k => { const n = S.notes[k], r = { ...verseRefOf(k), v2: n.to || keyParts(k).v }, ref = refLabel(r);
    out.push(
      <View key={'n' + k} style={{ backgroundColor: c.surface, borderRadius: 26, padding: 18, paddingBottom: 14, marginBottom: 12 }}>
        <Txt size={17} lh={1.55} tr={false} serif={S.settings.read === 'serif'}>{'“' + passage(r) + '”'}</Txt>
        <Pressable onPress={() => openRef(ref)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}><Icon name="pencil" size={16} color={c.ink} /><Txt w={700} size={14} tr={false} style={{ textDecorationLine: 'underline' }}>{refShow(ref)}</Txt></Pressable>
        <View style={{ marginTop: 12, padding: 12, paddingHorizontal: 14, borderRadius: 18, backgroundColor: c.surface2 }}><Txt size={15} tr={false}>{n.t}</Txt></View>
        <Mini items={[['pencil', 'Edit', () => openNote(k)], ['x', 'Remove', () => remove('notes', k)]]} />
      </View>); });
  if (f === 'all' || f === 'journal') {
    Object.entries(S.journal || {}).sort((x: any, y: any) => y[1].at - x[1].at).forEach(([k, j]: [string, any]) => { const [pid, dn] = k.split(':'), p = PACK[pid]; if (!p) return;
      out.push(<JItem key={'j' + k} label={t(p.title) + ', ' + t('day ' + dn).toLowerCase()} prompt={t(p.days[+dn - 1][2])} note={j.t} onOpen={() => go('/day', { p: pid, d: dn })} />); });
    (S.rec.trackers || []).forEach((x: any) => { const L = (S.rec.logs || {})[x.id] || {}; Object.keys(L).filter(k => L[k].journal && !L[k].partial).sort().reverse().forEach(k => { const l = L[k];
      out.push(<JItem key={'f' + x.id + k} label={frName(x) + ', ' + fmtDate(keyDate(k), { month: 'long', day: 'numeric' })} prompt={t(l.clean ? 'Stayed free' : 'Hard day') + ', ' + t(`cravings ${l.crave}/10`)} note={l.journal} onOpen={() => go('/free/check', { id: x.id, d: k })} />); }); });
  }
  return (
    <TabScreen>
      <View style={{ paddingTop: 14, paddingBottom: 18 }}><Title a="Words you" b="kept." /></View>
      <Chips scroll style={{ marginBottom: 18 }}>{F.map(([k, l]) => <Chip key={k} label={l} on={f === k} onPress={() => setF(k)} />)}</Chips>
      {out.length ? out : <Empty title="Nothing here yet" body={t(f === 'journal' ? 'Entries from affirmation packs and Break free check-in notes appear here. Your own entries live in My journal.' : f === 'hl' || f === 'marks' || f === 'notes' ? 'Open the Bible, tap a verse, and use the bar that appears.' : 'Tap Save on an affirmation, or turn a verse into your own in the Bible.')} />}
    </TabScreen>
  );
}
function PaperMini({ items }: { items: [string, string, () => void][] }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>{items.map(([icon, label, fn], i) => (
    <Pressable key={i} onPress={fn} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#F0EAF4' }}><Icon name={icon} size={17} color="#4E4459" /><Txt w={500} size={13.5} color="#4E4459">{label}</Txt></Pressable>))}</View>;
}
function JItem({ label, prompt, note, onOpen }: { label: string; prompt: string; note: string; onOpen: () => void }) {
  const c = useC();
  return (
    <View style={{ backgroundColor: c.surface, borderRadius: 26, padding: 18, paddingBottom: 14, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Icon name="journal" size={18} color={c.ink} /><Txt w={700} size={15} tr={false} style={{ flex: 1 }}>{label}</Txt></View>
      <Txt muted size={14} tr={false} style={{ marginTop: 4 }}>{prompt}</Txt>
      <View style={{ marginTop: 12, padding: 12, paddingHorizontal: 14, borderRadius: 18, backgroundColor: c.surface2 }}><Txt size={15} tr={false}>{note}</Txt></View>
      <Mini items={[['pencil', 'Open', onOpen]]} />
    </View>
  );
}
