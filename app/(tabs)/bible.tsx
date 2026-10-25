import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useStore, mutate, S as SS } from '@/lib/store';
import { BIBLE, KJV, NT_START, chapter, nextCh, parseRef, prevCh, refLabel, search, verseText } from '@/lib/bible';
import { BOOKS } from '@/lib/content';
import { bookName, refShow, t, locRefs } from '@/lib/i18n';
import { shareTextFor } from '@/lib/affirm';
import { copyText, shareText, openCard } from '@/lib/share';
import { BUI, bibleUIChanged, openChapter } from '@/screens/bibleNav';
import { useBibleUI } from '@/lib/hooks';
import { TabScreen, TopBar } from '@/ui/TabScreen';
import { Btn, Chip, Chips, IconBtn, Title, Txt, useC, shadow, tap } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { Glow, toast } from '@/ui/overlay';
import { Cont } from '@/features/blocks';
import { openAffirm, openNote } from '@/features/bibleSheets';
import { F, SERIF } from '@/lib/theme';
import { AlertBanner } from '@/features/AlertBanner';

export default function Bible() {
  useBibleUI(); useStore();
  useFocusEffect(React.useCallback(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { if (BUI.mode !== 'home') { BUI.mode = BUI.mode === 'read' ? 'chapters' : 'home'; BUI.sel = []; bibleUIChanged(); return true; } return false; });
    return () => sub.remove();
  }, []));
  if (BUI.mode === 'read') return <Reader />;
  if (BUI.mode === 'chapters') return <Chapters />;
  return <Home />;
}

function Home() {
  const S = useStore(); const c = useC();
  const [q, setQ] = useState(BUI.q); const [res, setRes] = useState<ReturnType<typeof search> | null>(null);
  const inp = useRef<TextInput>(null); const tm = useRef<any>(null);
  useEffect(() => { if (BUI.focusSearch) setTimeout(() => inp.current && inp.current.focus(), 250); }, [BUI.focusSearch]);
  useEffect(() => { clearTimeout(tm.current); tm.current = setTimeout(() => { BUI.q = q; setRes(q.trim() ? search(q.trim()) : null); }, 160); }, [q]);
  const r = q.trim() ? parseRef(q) : null; const nt = BUI.testament === 'nt', lo = nt ? NT_START : 0, hi = nt ? 66 : NT_START;
  const qn = q.toLowerCase().replace(/[^a-z0-9]/g, '');
  const jump = () => { if (!r) return; if (r.hasC) openChapter(r.b, r.c, r.v1, r.v2); else { BUI.b = r.b; BUI.mode = 'chapters'; BUI.q = ''; setQ(''); bibleUIChanged(); } };
  return (
    <TabScreen>
      <View style={{ paddingTop: 14, paddingBottom: 18 }}><Title a="Open the" b="Word." /></View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, minHeight: 56, borderRadius: 999, backgroundColor: c.surface2, marginBottom: 18 }}>
        <Icon name="search" color={c.muted} />
        <TextInput ref={inp} value={q} onChangeText={setQ} placeholder={t('Search words, or go to John 3:16')} placeholderTextColor={c.muted} returnKeyType="search" autoCorrect={false} onSubmitEditing={() => { if (r && (r.hasC || qn.length >= 3)) jump(); else if (res && res.hits[0]) openChapter(res.hits[0][0], res.hits[0][1], res.hits[0][2]); }}
          style={{ flex: 1, color: c.ink, fontFamily: F[400], fontSize: 16, paddingVertical: 12 }} accessibilityLabel={t('Search the Bible')} />
        {q ? <Pressable accessibilityLabel={t('Clear')} onPress={() => setQ('')}><Icon name="x" size={18} color={c.muted} /></Pressable> : null}
      </View>
      {q.trim() ? (
        <View>
          {r && (r.hasC || qn.length >= 3) ? (
            <Pressable onPress={() => { tap(); jump(); }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 58, paddingLeft: 20, paddingRight: 8, borderRadius: 999, backgroundColor: '#F4F01E', marginBottom: 12 }}>
              <Txt w={700} color="#17101F" tr={false}>{t('Go to') + ' ' + locRefs(r.hasC ? refLabel(r) : BOOKS[r.b])}</Txt>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><Icon name="arrow" size={20} color="#17101F" /></View>
            </Pressable>) : null}
          {res && res.terms.length && q.trim().length >= 3 ? (
            <>
              <Txt muted size={14} style={{ marginTop: 6, marginBottom: 10 }}>{res.total ? res.total + (res.total === 1 ? ' verse' : ' verses') + (res.total > 60 ? ', showing the first 60' : '') : 'No verses contain those words.'}</Txt>
              {res.hits.map(([b, ch, v]) => <Hit key={b + '.' + ch + '.' + v} b={b} c={ch} v={v} terms={res.terms} />)}
            </>) : null}
        </View>
      ) : (
        <View>
          {S.pos ? <Cont k="day" v={2} photo="word" small="Continue reading" title={bookName(S.pos.b) + ' ' + S.pos.c} tr={false} onPress={() => openChapter(S.pos!.b, S.pos!.c)} /> : null}
          <Chips style={{ marginBottom: 16 }}>
            <Chip label="Old Testament" on={!nt} onPress={() => { BUI.testament = 'ot'; bibleUIChanged(); }} />
            <Chip label="New Testament" on={nt} onPress={() => { BUI.testament = 'nt'; bibleUIChanged(); }} />
          </Chips>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {BOOKS.slice(lo, hi).map((n, i) => (
              <Pressable key={n} onPress={() => { tap(); BUI.b = lo + i; BUI.mode = 'chapters'; bibleUIChanged(); }} style={({ pressed }) => ({ width: '48.6%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, paddingVertical: 15, paddingHorizontal: 16, borderRadius: 20, backgroundColor: pressed ? c.surface2 : c.surface })}>
                <Txt w={500} size={16} lh={1.2} tr={false} style={{ flex: 1 }} numberOfLines={2}>{bookName(lo + i)}</Txt>
                <Txt muted size={13} tr={false}>{String(KJV[lo + i].length)}</Txt>
              </Pressable>))}
          </View>
        </View>
      )}
    </TabScreen>
  );
}
function Hit({ b, c: ch, v, terms }: { b: number; c: number; v: number; terms: string[] }) {
  const c = useC(); const txt = verseText(b, ch, v);
  const re = new RegExp('(' + terms.map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'ig');
  const parts = txt.split(re);
  return (
    <Pressable onPress={() => { tap(); openChapter(b, ch, v); }} style={{ padding: 14, paddingHorizontal: 16, borderRadius: 20, backgroundColor: c.surface, marginBottom: 8 }}>
      <Txt w={700} size={14} color={c.accent} tr={false} style={{ marginBottom: 2 }}>{locRefs(refLabel({ b, c: ch, v1: v, v2: v }))}</Txt>
      <Text style={{ fontFamily: SS.settings.read === 'serif' ? SERIF : F[400], fontSize: 16.5, lineHeight: 25, color: c.ink }}>{parts.map((p, i) => i % 2 ? <Text key={i} style={{ backgroundColor: c.hl[0] }}>{p}</Text> : p)}</Text>
    </Pressable>
  );
}

function Chapters() {
  const S = useStore(); const c = useC(); const n = KJV[BUI.b].length;
  return (
    <TabScreen>
      <View style={{ paddingTop: 6 }}><IconBtn name="chevl" a11y="All books" onPress={() => { BUI.mode = 'home'; bibleUIChanged(); }} /></View>
      <Text style={{ fontFamily: F[300], fontSize: 44, lineHeight: 46, letterSpacing: -1.5, color: c.ink, paddingTop: 18, paddingBottom: 4 }}>{bookName(BUI.b)}{'\n'}<Text style={{ fontFamily: F[700] }}>{t(n + (n === 1 ? ' chapter' : ' chapters'))}</Text></Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
        {Array.from({ length: n }, (_, i) => { const cur = S.pos && S.pos.b === BUI.b && S.pos.c === i + 1; return (
          <Pressable key={i} onPress={() => { tap(); openChapter(BUI.b, i + 1); }} style={({ pressed }) => ({ width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: cur ? '#B6AEFF' : pressed ? c.surface2 : c.surface })}>
            <Txt w={600} tr={false} color={cur ? '#1E1446' : undefined}>{String(i + 1)}</Txt>
          </Pressable>); })}
      </View>
    </TabScreen>
  );
}

function Reader() {
  const S = useStore(); const c = useC(); const ins = useSafeAreaInsets();
  const { b, c: ch } = BUI; const vs = chapter(b, ch); const sv = useRef<ScrollView>(null); const [textY, setTextY] = useState(0); const [textH, setTextH] = useState(0);
  const sel = BUI.sel, fs = S.settings.font, serif = S.settings.read === 'serif';
  useEffect(() => { if (BUI.scrollTo && textH) { const y = textY + textH * ((BUI.scrollTo - 1) / Math.max(1, vs.length)) - 160; sv.current && sv.current.scrollTo({ y: Math.max(0, y), animated: false }); BUI.scrollTo = 0; } }, [textH, b, ch]);
  useEffect(() => { if (!BUI.scrollTo) sv.current && sv.current.scrollTo({ y: 0, animated: false }); }, [b, ch]);
  const toggle = (v: number) => { BUI.sel = sel.includes(v) ? sel.filter(x => x !== v) : [...sel, v]; if (!BUI.sel.length) BUI.hlOpen = false; bibleUIChanged(); };
  const prev = prevCh(b, ch), next = nextCh(b, ch);
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Glow />
      <TopBar />
      <ScrollView ref={sv} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 220 + ins.bottom }}>
        <AlertBanner />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 6 }}>
          <IconBtn name="chevl" a11y="All books" onPress={() => { BUI.mode = 'home'; BUI.sel = []; bibleUIChanged(); }} />
          <View style={{ flex: 1 }} />
          <IconBtn a11y="Smaller text" onPress={() => mutate(s => { s.settings.font = Math.max(16, s.settings.font - 2); })}><Txt w={600} size={14} tr={false}>A</Txt></IconBtn>
          <IconBtn a11y="Larger text" onPress={() => mutate(s => { s.settings.font = Math.min(30, s.settings.font + 2); })}><Txt w={600} size={20} tr={false}>A</Txt></IconBtn>
        </View>
        <Pressable accessibilityLabel={t('Choose another chapter of') + ' ' + bookName(b)} onPress={() => { BUI.mode = 'chapters'; BUI.sel = []; bibleUIChanged(); }}>
          <Text style={{ fontFamily: F[300], fontSize: 44, lineHeight: 46, letterSpacing: -1.5, color: c.ink, paddingTop: 18, paddingBottom: 4 }}>{bookName(b) + ' '}<Text style={{ fontFamily: F[700] }}>{ch}</Text></Text>
        </Pressable>
        <Txt muted size={14} style={{ marginTop: 4, marginBottom: 8 }}>Tap a verse to highlight, save, share or write a note.</Txt>
        <View onLayout={e => { setTextY(e.nativeEvent.layout.y); setTextH(e.nativeEvent.layout.height); }}>
          <Text style={{ fontFamily: serif ? SERIF : F[400], fontSize: fs, lineHeight: Math.round(fs * 1.8), color: c.ink, paddingTop: 6, paddingBottom: 12 }}>
            {vs.map((tx, i) => { if (!tx) return null; const v = i + 1, k = b + '.' + ch + '.' + v, hl = S.hl[k], on = sel.includes(v);
              return (
                <Text key={v} onPress={() => toggle(v)} accessibilityRole="button" accessibilityState={{ selected: on }}
                  style={{ backgroundColor: hl !== undefined ? c.hl[hl] : undefined, textDecorationLine: on ? 'underline' : 'none', textDecorationColor: c.accent, textDecorationStyle: 'solid' }}>
                  <Text style={{ fontFamily: F[700], fontSize: Math.round(fs * 0.56), color: c.accent }}>{v + ' '}</Text>
                  {tx}
                  {S.marks.includes(k) ? <Text style={{ color: c.accent }}>{' ◆'}</Text> : null}
                  {S.notes[k] ? <Text style={{ color: c.accent }}>{' ✎'}</Text> : null}
                  {' '}
                </Text>); })}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 20 }}>
          <Btn label="Previous" icon="chevl" style={{ flex: 1 }} disabled={!prev} onPress={() => prev && openChapter(prev.b, prev.c)} />
          <Btn label="Next" kind="primary" style={{ flex: 1 }} disabled={!next} onPress={() => next && openChapter(next.b, next.c)}><Icon name="chevr" size={20} color={c.onPill} /></Btn>
        </View>
      </ScrollView>
      {sel.length ? <SelBar /> : null}
    </View>
  );
}

/* the bar that appears when verses are selected */
function SelBar() {
  const S = useStore(); const c = useC(); const ins = useSafeAreaInsets();
  const { b, c: ch } = BUI; const list = [...BUI.sel].sort((x, y) => x - y), ks = list.map(v => b + '.' + ch + '.' + v), allMarked = ks.every(k => S.marks.includes(k));
  const groups: [number, number][] = []; list.forEach(v => { const g = groups[groups.length - 1]; if (g && g[1] === v - 1) g[1] = v; else groups.push([v, v]); });
  const ref = (BOOKS[b] === 'Psalms' ? 'Psalm' : BOOKS[b]) + ' ' + ch + ':' + groups.map(([a, z]) => a === z ? a : a + '-' + z).join(', ');
  const text = list.map(v => verseText(b, ch, v)).join(' ');
  const clear = () => { BUI.sel = []; BUI.hlOpen = false; bibleUIChanged(); };
  const color = (col: number) => { const same = col >= 0 && ks.every(k => S.hl[k] === col); mutate(s => ks.forEach(k => { if (col < 0 || same) delete s.hl[k]; else s.hl[k] = col; })); clear(); toast(col < 0 || same ? 'Highlight removed' : 'Highlighted'); };
  const acts: [string, string, () => void, boolean?][] = [
    ['marker', 'Highlight', () => { BUI.hlOpen = !BUI.hlOpen; bibleUIChanged(); }, BUI.hlOpen],
    ['pencil', 'Note', () => openNote(b + '.' + ch + '.' + list[0], list[list.length - 1], clear)],
    ['spark', 'Affirm', () => openAffirm(ref, text, clear)],
    ['bookmark', allMarked ? 'Bookmarked' : 'Bookmark', () => { mutate(s => { if (allMarked) s.marks = s.marks.filter(k => !ks.includes(k)); else ks.forEach(k => { if (!s.marks.includes(k)) s.marks.push(k); }); }); clear(); toast(allMarked ? 'Bookmark removed' : 'Bookmarked'); }, allMarked],
    ['copy', 'Copy', async () => { toast((await copyText('“' + text + '”\n' + t(ref) + ' (' + refShow('').trim() + ')')) ? 'Copied' : 'Could not copy'); }],
    ['share', 'Share', () => shareText(shareTextFor('', text, ref))],
    ['image', 'Card', () => openCard({ text, ref })],
    ['x', 'Clear', clear],
  ];
  return (
    <View style={{ position: 'absolute', left: 10, right: 10, bottom: 86 + ins.bottom }}>
      <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 28, padding: 6, ...shadow(14, 0.3) }}>
        {BUI.hlOpen ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, paddingTop: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: c.line, marginBottom: 4 }}>
            {['#F4F01E', '#23C25F', '#B6AEFF', '#FFB0D4'].map((col, i) => <Pressable key={i} accessibilityLabel={t(['Lemon highlight', 'Green highlight', 'Lavender highlight', 'Pink highlight'][i])} onPress={() => color(i)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: col }} />)}
            <Pressable accessibilityLabel={t('Remove highlight')} onPress={() => color(-1)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={18} color={c.muted} /></Pressable>
          </View>) : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 2 }}>
          {acts.map(([icon, label, fn, on]) => (
            <Pressable key={label} onPress={() => { tap(); fn(); }} style={({ pressed }) => ({ minWidth: 60, alignItems: 'center', gap: 3, paddingVertical: 8, paddingHorizontal: 6, borderRadius: 20, backgroundColor: pressed ? c.surface2 : 'transparent' })}>
              <Icon name={icon} color={on ? c.accent : c.muted} fill={icon === 'bookmark' && on} />
              <Txt w={500} size={11.5} color={on ? c.accent : c.muted}>{label}</Txt>
            </Pressable>))}
        </ScrollView>
      </View>
    </View>
  );
}
