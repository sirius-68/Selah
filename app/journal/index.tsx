import React, { useState } from 'react';
import { Pressable, Share, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore, mutate, S as SS } from '@/lib/store';
import { BICONS, NC } from '@/lib/content';
import { parseRef, passage } from '@/lib/bible';
import { checkinNotes, jStreak, jbook, liveNotes, ncol, newNote, fmtWhen } from '@/lib/journal';
import { dateKey, keyDate, todayK } from '@/lib/util';
import { fmtDate, t } from '@/lib/i18n';
import { F } from '@/lib/theme';
import { Page, closeSheet, go, openSheet, SheetTitle, toast } from '@/ui/overlay';
import { Btn, Chip, Chips, Empty, Field, Input, LinkBtn, Txt, useC, shadow, tap } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { Board, BookCover, NGrid, NoteSticky, Sticky } from '@/features/journalUI';

const TABS: [string, string][] = [['notebooks', 'Notebooks'], ['notes', 'Notes'], ['board', 'Board'], ['checkin', 'Check-in notes']];
const JX = { tab: 'notebooks', book: null as string | null, tag: '', sort: 'new', bi: 0 };

export default function Journal() {
  const S = useStore(); const c = useC(); const ins = useSafeAreaInsets();
  const p = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTabS] = useState(p.tab && TABS.some(x => x[0] === p.tab) ? p.tab : JX.tab); const [q, setQ] = useState('');
  const [, f] = useState(0); const re = () => f(x => x + 1);
  const setTab = (x: string) => { JX.tab = x; setTabS(x); };
  const all = liveNotes(), st = jStreak();
  const open = (id: string) => go('/journal/edit', { id });
  const create = (book?: string) => { const n = newNote({ book: book || JX.book || S.jn.books[0].id }); go('/journal/edit', { id: n.id, fresh: '1' }); };
  const ciSticky = (x: any) => x.kind === 'free'
    ? <Sticky key={'f' + x.t.id + x.k} id={x.t.id + x.k} color={x.l.clean ? NC.mint.c : NC.rose.c} title={(x.t.discreet ? t('Private tracker') : x.t.label) + ', ' + fmtDate(keyDate(x.k), { month: 'short', day: 'numeric' })} body={x.l.journal.slice(0, 160)} meta={t(x.l.clean ? 'Stayed free' : 'Hard day') + ', ' + t(`cravings ${x.l.crave}/10`)} onPress={() => go('/free/check', { id: x.t.id, d: x.k })} />
    : <Sticky key={'p' + x.k} id={x.k} color={NC.lilac.c} title={t(x.p.title) + ', ' + t('day ' + x.dn).toLowerCase()} body={x.j.t.slice(0, 160)} meta={fmtWhen(x.at)} onPress={() => go('/day', { p: x.p.id, d: String(x.dn) })} />;
  let body: React.ReactNode;
  if (q.trim()) {
    const ql = q.trim().toLowerCase(); const res = all.filter((n: any) => [n.title, n.body, n.verse, n.mood, (n.tags || []).join(' '), (n.items || []).map((i: any) => i.t).join(' ')].join(' ').toLowerCase().includes(ql));
    const cres = checkinNotes().filter(x => (x.kind === 'free' ? x.l.journal : x.j.t).toLowerCase().includes(ql)); const n = res.length + cres.length;
    body = <>
      <Txt muted size={14} style={{ marginBottom: 10 }}>{n ? `${n} result${n === 1 ? '' : 's'}` : 'Nothing matches that search.'}</Txt>
      <NGrid notes={res} open={open} />
      {cres.length ? <><Txt w={600} size={14} style={{ marginTop: 18 }}>In check-in notes</Txt><Board>{cres.map(ciSticky)}</Board></> : null}
    </>;
  } else if (tab === 'notebooks') {
    const B = S.jn.books, i = ((JX.bi % B.length) + B.length) % B.length, L = B[(i - 1 + B.length) % B.length], R = B[(i + 1) % B.length];
    body = <>
      <View style={{ height: 340, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
        {B.length > 2 ? <BookCover b={L} pos="l" onPress={() => { JX.bi--; re(); }} /> : null}
        {B.length > 1 ? <BookCover b={R} pos="r" onPress={() => { JX.bi++; re(); }} /> : null}
        <BookCover b={B[i]} pos="front" onPress={() => { JX.book = B[i].id; JX.tag = ''; setTab('notes'); }} />
        {B.length > 1 ? <>
          <Pressable accessibilityLabel={t('Previous notebook')} onPress={() => { JX.bi--; re(); }} style={{ position: 'absolute', left: 0, top: '44%', zIndex: 3, width: 42, height: 42, borderRadius: 21, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}><Icon name="chevl" color={c.ink} /></Pressable>
          <Pressable accessibilityLabel={t('Next notebook')} onPress={() => { JX.bi++; re(); }} style={{ position: 'absolute', right: 0, top: '44%', zIndex: 3, width: 42, height: 42, borderRadius: 21, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}><Icon name="chevr" color={c.ink} /></Pressable>
        </> : null}
        <Pressable accessibilityLabel={t('New entry in') + ' ' + t(B[i].name)} onPress={() => create(B[i].id)} style={{ position: 'absolute', bottom: -4, zIndex: 4, width: 62, height: 62, borderRadius: 31, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow(10, 0.25) }}><Icon name="plus" size={26} color="#17101F" /></Pressable>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 30, paddingBottom: 10 }}><Txt w={700} size={21}>All notebooks</Txt><LinkBtn label="New notebook" onPress={() => openSheet(<NewBook onDone={i2 => { JX.bi = i2; re(); }} />)} /></View>
      {B.map((b: any) => { const n = liveNotes().filter((x: any) => x.book === b.id).length; return (
        <Pressable key={b.id} onPress={() => { tap(); JX.book = b.id; JX.tag = ''; setTab('notes'); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, paddingRight: 16, borderRadius: 24, backgroundColor: c.surface, marginBottom: 8 }}>
          <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: ncol(b.c), alignItems: 'center', justifyContent: 'center' }}><Icon name={b.icon} color="#2A2233" /></View>
          <View style={{ flex: 1 }}><Txt w={600} tr={false}>{t(b.name)}</Txt><Txt muted size={13} tr={false}>{t(n + (n === 1 ? ' entry' : ' entries'))}</Txt></View>
          <Icon name="chevr" size={18} color={c.muted} />
        </Pressable>); })}
      <Pressable onPress={() => go('/journal/trash')} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, paddingRight: 16, borderRadius: 24, backgroundColor: c.surface, marginBottom: 8 }}>
        <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}><Icon name="x" color={c.ink} /></View>
        <View style={{ flex: 1 }}><Txt w={600}>Recently deleted</Txt><Txt muted size={13} tr={false}>{t(S.jn.notes.filter((n: any) => n.trash).length + ' kept for 30 days')}</Txt></View>
        <Icon name="chevr" size={18} color={c.muted} />
      </Pressable>
      <Btn block icon="download" label="Export my journal" style={{ marginTop: 18 }} onPress={exportJournal} />
    </>;
  } else if (tab === 'notes') {
    let ns = all.filter((n: any) => !JX.book || n.book === JX.book).filter((n: any) => !JX.tag || (n.tags || []).includes(JX.tag) || n.mood === JX.tag);
    ns.sort((a: any, b: any) => (+b.pin - +a.pin) || (JX.sort === 'old' ? a.created - b.created : JX.sort === 'az' ? (a.title || a.body).localeCompare(b.title || b.body) : b.updated - a.updated));
    const tags = [...new Set(all.flatMap((n: any) => n.tags || []))].slice(0, 12) as string[];
    body = <>
      <Chips scroll style={{ marginBottom: 14 }}>
        {JX.book ? <Chip on tr={false} label={t(jbook(JX.book).name) + ' ×'} onPress={() => { JX.book = null; re(); }} /> : null}
        {[['new', 'Newest'], ['old', 'Oldest'], ['az', 'A to Z']].map(([k, l]) => <Chip key={k} label={l} on={JX.sort === k} onPress={() => { JX.sort = k; re(); }} />)}
        {tags.map(x => <Chip key={x} tr={false} label={'#' + x} on={JX.tag === x} onPress={() => { JX.tag = JX.tag === x ? '' : x; re(); }} />)}
      </Chips>
      {ns.length ? <NGrid notes={ns} open={open} /> : <Empty title="No entries yet" body={t((JX.book ? 'This notebook is empty. ' : '') + 'Tap the plus button to write your first entry.')} />}
    </>;
  } else if (tab === 'board') {
    const td = all.filter((n: any) => dateKey(new Date(n.updated)) === todayK()), list = td.length ? td : all.slice().sort((a: any, b: any) => b.updated - a.updated).slice(0, 8);
    body = <>
      <Txt w={700} size={21} style={{ marginTop: 4, marginBottom: 14 }}>{td.length ? 'Today’s notes' : 'Recent notes'}</Txt>
      {list.length ? <Board>{list.map((n: any) => <NoteSticky key={n.id} n={n} onPress={() => open(n.id)} />)}</Board> : <Empty title="Your board is empty" body={t('Notes you write today are pinned here.')} />}
    </>;
  } else {
    const ci = checkinNotes(), fr = ci.filter(x => x.kind === 'free'), pk = ci.filter(x => x.kind === 'pack');
    body = <>
      <Txt muted size={16} style={{ marginBottom: 16 }}>Notes you leave at the end of a Break free check-in, and entries from affirmation packs, are kept here.</Txt>
      {!ci.length ? <Empty title="No check-in notes yet" body={t('Leave a note when you check in on Break free and it will show up here.')} /> : <>
        {fr.length ? <><Txt w={700} size={21} style={{ marginTop: 4, marginBottom: 14 }}>Break free check-ins</Txt><Board>{fr.map(ciSticky)}</Board></> : null}
        {pk.length ? <><Txt w={700} size={21} style={{ marginTop: 26, marginBottom: 14 }}>Affirmation packs</Txt><Board>{pk.map(ciSticky)}</Board></> : null}
      </>}
    </>;
  }
  return (
    <View style={{ flex: 1 }}>
      <Page title="" back={false} right={<View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingLeft: 10, paddingRight: 14, borderRadius: 999, backgroundColor: '#F4F01E' }}><Icon name="journal" size={18} color="#17101F" /><Txt w={600} size={13} color="#17101F" tr={false}>{t(all.length + (all.length === 1 ? ' entry' : ' entries'))}</Txt></View>} bottom={110}>
        <Txt tr={false} style={{ fontFamily: F[300], fontSize: 42, lineHeight: 44, letterSpacing: -1.4, marginTop: 4 }}>{t('Write it down,') + '\n' + t('keep it') + ' '}<Txt w={700} size={42} tr={false}>{t('close.')}</Txt></Txt>
        <Txt muted size={16} style={{ marginTop: 10, marginBottom: 18 }}>{st ? `You’ve written ${st} day${st === 1 ? '' : 's'} in a row.` : 'A quiet place for prayers, thoughts and thanks.'}</Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 18, borderWidth: 1.5, borderColor: '#F4F01E', borderRadius: 999 }}>
          <Icon name="search" color={c.muted} />
          <TextInput value={q} onChangeText={setQ} placeholder={t('Search your journal')} placeholderTextColor={c.muted} style={{ flex: 1, color: c.ink, fontFamily: F[400], fontSize: 16, paddingVertical: 12 }} />
        </View>
        <View style={{ flexDirection: 'row', gap: 22, marginVertical: 22, flexWrap: 'wrap' }}>
          {TABS.map(([k, l]) => <Pressable key={k} onPress={() => { setTab(k); setQ(''); }} style={{ paddingTop: 6, paddingBottom: 8 }}>
            <Txt w={tab === k ? 700 : 500} size={16} color={tab === k ? c.ink : c.muted}>{l}</Txt>
            {tab === k ? <View style={{ position: 'absolute', left: 0, bottom: 0, width: 24, height: 3, borderRadius: 3, backgroundColor: '#F4F01E' }} /> : null}
          </Pressable>)}
        </View>
        {body}
      </Page>
      {tab !== 'notebooks' || q ? <Pressable accessibilityLabel={t('New journal entry')} onPress={() => create()} style={{ position: 'absolute', right: 20, bottom: 22 + ins.bottom, width: 62, height: 62, borderRadius: 31, backgroundColor: c.pill, alignItems: 'center', justifyContent: 'center', ...shadow(12, 0.3) }}><Icon name="plus" size={26} color={c.onPill} /></Pressable> : null}
    </View>
  );
}
function NewBook({ onDone }: { onDone: (i: number) => void }) {
  const c = useC(); const [nm, setNm] = useState(''); const [ic, setIc] = useState(BICONS[0]); const [col, setCol] = useState('mint');
  return <View>
    <SheetTitle>New notebook</SheetTitle>
    <Field label="Name"><Input value={nm} onChangeText={setNm} maxLength={30} placeholder="For example, Bible study" autoFocus /></Field>
    <Field label="Icon"><Chips>{BICONS.map(x => <Chip key={x} icon={x} a11y={x} on={ic === x} onPress={() => setIc(x)} />)}</Chips></Field>
    <Field label="Colour"><View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>{Object.entries(NC).map(([k, v]) => <Pressable key={k} accessibilityLabel={t(v.n)} onPress={() => setCol(k)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: v.c, borderWidth: 3, borderColor: col === k ? c.ink : c.surface }} />)}</View></Field>
    <Btn kind="primary" block label="Create notebook" onPress={() => { if (!nm.trim()) { toast('Give your notebook a name'); return; } mutate(s => { s.jn.books.push({ id: 'b' + Date.now().toString(36), name: nm.trim(), icon: ic, c: col, at: Date.now() }); }); onDone(SS.jn.books.length - 1); closeSheet(); toast('Notebook created'); }} />
  </View>;
}
function exportJournal() {
  const lines = ['My Selah journal', 'Exported ' + new Date().toLocaleString(), ''];
  SS.jn.books.forEach((b: any) => { const ns = liveNotes().filter((n: any) => n.book === b.id).sort((a: any, c: any) => a.created - c.created); if (!ns.length) return; lines.push('== ' + b.name + ' ==', '');
    ns.forEach((n: any) => { lines.push(new Date(n.created).toLocaleString() + (n.mood ? ' (' + n.mood + ')' : '')); if (n.title) lines.push(n.title); if (n.body) lines.push(n.body); (n.items || []).forEach((i: any) => lines.push((i.d ? '[x] ' : '[ ] ') + i.t)); if (n.verse) { const r = parseRef(n.verse); lines.push(n.verse + ': ' + (r ? passage(r) : '')); } if ((n.tags || []).length) lines.push('Tags: ' + n.tags.join(', ')); lines.push(''); }); });
  const ci = checkinNotes(); if (ci.length) { lines.push('== Check-in notes ==', ''); ci.forEach(x => { lines.push(x.kind === 'free' ? x.t.label + ', ' + x.k : x.p.title + ', day ' + x.dn); lines.push(x.kind === 'free' ? x.l.journal : x.j.t, ''); }); }
  Share.share({ title: 'selah-journal-' + todayK() + '.txt', message: lines.join('\n') }).catch(() => {});
}
