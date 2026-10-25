import React, { useEffect, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useStore, mutate, S as SS } from '@/lib/store';
import { JMOODS, JPROMPTS, NC } from '@/lib/content';
import { parseRef, passage, refLabel } from '@/lib/bible';
import { isEmptyNote, jnote, nWords, ncol, fmtWhen } from '@/lib/journal';
import { fmtDate, locRefs, refShow, t } from '@/lib/i18n';
import { shareText } from '@/lib/share';
import { F } from '@/lib/theme';
import { Page, closeSheet, openSheet, SheetTitle, toast } from '@/ui/overlay';
import { Btn, Chip, Chips, Field, IconBtn, Input, Txt, useC, tap } from '@/ui/kit';
import { Icon } from '@/ui/Icon';

const INK = '#2A2233';
export default function JournalEdit() {
  useStore(); const c = useC(); const { id, fresh } = useLocalSearchParams<{ id: string; fresh?: string }>();
  const n = jnote(id); const [armed, setArmed] = useState(false); const [saved, setSaved] = useState(true); const tm = useRef<any>(null);
  const bodyRef = useRef<TextInput>(null);
  useEffect(() => { if (fresh) setTimeout(() => bodyRef.current && bodyRef.current.focus(), 300); }, []);
  useEffect(() => () => { const x = jnote(id); if (x && isEmptyNote(x)) mutate(s => { s.jn.notes = s.jn.notes.filter((y: any) => y.id !== id); }); }, []);
  if (!n) return <Page title=""><Txt muted>This entry was removed.</Txt></Page>;
  const touch = (fn: (x: any) => void, quick?: boolean) => { mutate(s => { const x = s.jn.notes.find((y: any) => y.id === id); if (x) { fn(x); x.updated = Date.now(); } }, { quiet: !quick }); setSaved(false); clearTimeout(tm.current); tm.current = setTimeout(() => { mutate(() => {}); setSaved(true); }, 400); };
  const vr = n.verse ? parseRef(n.verse) : null;
  const del = () => { if (!armed) { setArmed(true); setTimeout(() => setArmed(false), 3500); return; } mutate(s => { const x = s.jn.notes.find((y: any) => y.id === id); if (!x) return; if (isEmptyNote(x)) s.jn.notes = s.jn.notes.filter((y: any) => y.id !== id); else x.trash = Date.now(); }); router.back(); toast('Moved to Recently deleted'); };
  return (
    <Page title="" right={<View style={{ flexDirection: 'row', gap: 4 }}>
      <IconBtn name="bookmark" fill={n.pin} a11y={n.pin ? 'Unpin entry' : 'Pin entry'} onPress={() => { touch(x => { x.pin = !x.pin; }, true); toast(!n.pin ? 'Pinned to the top' : 'Unpinned'); }} bg={n.pin ? '#FFB0D4' : undefined} color={n.pin ? '#4A0A14' : undefined} />
      <IconBtn name="share" a11y="Share entry" onPress={() => shareText([n.title, n.body, (n.items || []).map((i: any) => (i.d ? '✓ ' : '• ') + i.t).join('\n'), n.verse ? locRefs(n.verse) + ': “' + (vr ? passage(vr) : '') + '”' : ''].filter(Boolean).join('\n\n') + '\n\n' + t('Written in Selah'))} />
      {armed ? <Pressable onPress={del} style={{ height: 46, paddingHorizontal: 14, borderRadius: 23, backgroundColor: c.danger, justifyContent: 'center' }}><Txt w={700} size={12} color="#fff">Delete?</Txt></Pressable> : <IconBtn name="x" a11y="Delete entry" onPress={del} />}
    </View>}>
      <View style={{ position: 'relative', marginTop: 4, paddingTop: 18, paddingRight: 18, paddingBottom: 22, paddingLeft: 50, borderTopLeftRadius: 8, borderTopRightRadius: 30, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, backgroundColor: ncol(n.c) }}>
        <View pointerEvents="none" style={{ position: 'absolute', left: 15, top: 10, bottom: 10, width: 14, overflow: 'hidden' }}>{Array.from({ length: 40 }, (_, i) => <View key={i} style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: c.bg, marginBottom: 18 }} />)}</View>
        <Txt w={600} size={13} color={INK} tr={false} style={{ opacity: 0.62 }}>{fmtDate(n.created, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</Txt>
        <TextInput value={n.title} onChangeText={v => touch(x => { x.title = v; })} placeholder={t('Title')} placeholderTextColor="rgba(42,34,51,0.42)" maxLength={80} style={{ fontFamily: F[700], fontSize: 26, color: INK, paddingVertical: 8, letterSpacing: -0.5 }} />
        <TextInput ref={bodyRef} value={n.body} onChangeText={v => touch(x => { x.body = v; })} placeholder={t('Start writing…')} placeholderTextColor="rgba(42,34,51,0.42)" multiline textAlignVertical="top" scrollEnabled={false} style={{ minHeight: 320, fontFamily: F[400], fontSize: 17, lineHeight: 32, color: INK, padding: 0 }} />
        {(n.items || []).length ? <View style={{ marginTop: 10 }}>{n.items.map((it: any, i: number) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 40 }}>
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: it.d }} onPress={() => touch(x => { x.items[i].d = !x.items[i].d; }, true)} style={{ width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: it.d ? INK : 'rgba(42,34,51,0.45)', backgroundColor: it.d ? INK : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{it.d ? <Icon name="check" size={16} color={ncol(n.c)} stroke={3} /> : null}</Pressable>
            <TextInput value={it.t} onChangeText={v => touch(x => { x.items[i].t = v; })} placeholder={t('List item')} placeholderTextColor="rgba(42,34,51,0.42)" onSubmitEditing={() => touch(x => { x.items.splice(i + 1, 0, { t: '', d: false }); }, true)} blurOnSubmit={false} style={{ flex: 1, fontFamily: F[400], fontSize: 16, color: INK, textDecorationLine: it.d ? 'line-through' : 'none', opacity: it.d ? 0.6 : 1 }} />
            <Pressable accessibilityLabel={t('Remove item')} onPress={() => touch(x => { x.items.splice(i, 1); }, true)} style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}><Icon name="x" size={16} color={INK} /></Pressable>
          </View>))}</View> : null}
        {vr ? <View style={{ marginTop: 14, padding: 12, paddingRight: 40, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.5)' }}>
          <Txt w={700} size={13} color={INK} tr={false}>{refShow(n.verse)}</Txt>
          <Txt size={15} lh={1.45} color={INK} tr={false} style={{ marginTop: 2 }}>{'“' + passage(vr) + '”'}</Txt>
          <Pressable accessibilityLabel={t('Remove verse')} onPress={() => touch(x => { x.verse = ''; }, true)} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}><Icon name="x" size={16} color={INK} /></Pressable>
        </View> : null}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, paddingRight: 30 }}>
          <Txt w={600} size={12} color={INK} tr={false} style={{ opacity: 0.6 }}>{t(nWords(n) + ' words')}</Txt>
          <Txt w={600} size={12} color={INK} style={{ opacity: 0.6 }}>{saved ? 'Saved' : 'Saving…'}</Txt>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 22 }}>
        {[['check', 'Checklist', () => touch(x => { x.items = x.items || []; x.items.push({ t: '', d: false }); }, true)], ['book', 'Verse', () => openSheet(<VerseSheet id={id} />)], ['spark', 'Prompt', () => { const p = t(JPROMPTS[Math.floor(Math.random() * JPROMPTS.length)]); touch(x => { x.body = (x.body ? x.body.replace(/\s*$/, '') + '\n\n' : '') + p + '\n'; }, true); setTimeout(() => bodyRef.current && bodyRef.current.focus(), 100); }]].map(([ic, l, fn]: any) => (
          <Pressable key={l} onPress={() => { tap(); fn(); }} style={{ flex: 1, alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 6, borderRadius: 22, backgroundColor: c.surface }}><Icon name={ic} color={c.accent} /><Txt w={600} size={13}>{l}</Txt></Pressable>))}
      </View>
      <Field label="Colour"><View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>{Object.entries(NC).map(([k, v]) => <Pressable key={k} accessibilityLabel={t(v.n)} onPress={() => touch(x => { x.c = k; }, true)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: v.c, borderWidth: 3, borderColor: n.c === k ? c.ink : c.surface }} />)}</View></Field>
      <Field label="Notebook"><Chips>{SS.jn.books.map((b: any) => <Chip key={b.id} icon={b.icon} tr={false} label={t(b.name)} on={n.book === b.id} onPress={() => touch(x => { x.book = b.id; }, true)} />)}</Chips></Field>
      <Field label="Mood"><Chips>{JMOODS.map(m => <Chip key={m} label={m} on={n.mood === m} onPress={() => touch(x => { x.mood = x.mood === m ? '' : m; }, true)} />)}</Chips></Field>
      <Field label="Tags" hint="Separate tags with commas."><TagInput n={n} touch={touch} /></Field>
      <Txt muted size={13.5} tr={false}>{t('Created') + ' ' + fmtWhen(n.created) + (n.updated - n.created > 60000 ? ', ' + t('edited') + ' ' + fmtWhen(n.updated) : '') + '.'}</Txt>
    </Page>
  );
}
function TagInput({ n, touch }: { n: any; touch: (fn: (x: any) => void) => void }) {
  const [v, setV] = useState((n.tags || []).join(', '));
  return <Input value={v} onChangeText={x => { setV(x); touch(y => { y.tags = [...new Set(x.split(',').map(s => s.trim().replace(/^#/, '')).filter(Boolean))].slice(0, 10); }); }} placeholder="family, work, answered prayer" autoCapitalize="none" />;
}
function VerseSheet({ id }: { id: string }) {
  const [v, setV] = useState('');
  return <View>
    <SheetTitle>Attach a verse</SheetTitle>
    <Field label="Reference"><Input value={v} onChangeText={setV} placeholder="For example, Psalm 23:1 or John 3:16-17" autoFocus autoCorrect={false} /></Field>
    <Btn kind="primary" block label="Attach verse" onPress={() => { const r = parseRef(v.trim()); if (!r || !r.hasC) { toast('Try a reference like Psalm 23:1'); return; } if (!r.v1) { r.v1 = 1; r.v2 = 0; } mutate(s => { const x = s.jn.notes.find((y: any) => y.id === id); if (x) { x.verse = refLabel(r); x.updated = Date.now(); } }); closeSheet(); }} />
  </View>;
}
