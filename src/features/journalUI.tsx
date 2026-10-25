/* Journal pieces: notebook covers, note cards, sticky notes with pins and tape. */
import React from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, RadialGradient, Circle, Rect, Stop } from 'react-native-svg';
import { NC, BICONS } from '../lib/content';
import { hash } from '../lib/util';
import { fmtDate, t } from '../lib/i18n';
import { fmtWhen, jbook, liveNotes, ncol, tilt } from '../lib/journal';
import { Txt, shadow, tap } from '../ui/kit';
import { Icon } from '../ui/Icon';
import { F, HAND, HAND_B } from '../lib/theme';

const INK = '#2A2233';
function Pin({ id }: { id: string }) {
  const v = hash(id) % 3;
  if (v === 0) return <View style={{ position: 'absolute', top: -9, alignSelf: 'center', left: '50%', marginLeft: -10, width: 20, height: 20 }}><Svg width={20} height={20}><Defs><RadialGradient id={'pn' + id} cx="0.35" cy="0.32" r="0.7"><Stop offset="0" stopColor="#FF9C9C" /><Stop offset="0.58" stopColor="#D61F3C" /><Stop offset="1" stopColor="#8F0D22" /></RadialGradient></Defs><Circle cx={10} cy={10} r={10} fill={`url(#pn${id})`} /></Svg></View>;
  if (v === 1) return <View style={{ position: 'absolute', top: -11, left: '50%', marginLeft: -34, width: 68, height: 22, backgroundColor: 'rgba(255,160,110,0.78)', transform: [{ rotate: '-4deg' }] }} />;
  return <View style={{ position: 'absolute', top: -16, right: 16 }}><Svg width={16} height={38} viewBox="0 0 24 48"><Path d="M8 40V10a4 4 0 0 1 8 0v26a6 6 0 0 1-12 0V14" stroke="#7E86A8" strokeWidth={3.6} strokeLinecap="round" fill="none" /></Svg></View>;
}
function Curl() { return <View style={{ position: 'absolute', right: 0, bottom: 0, width: 28, height: 28 }}><Svg width={28} height={28}><Defs><LinearGradient id="curl" x1="0" y1="0" x2="1" y2="1"><Stop offset="0.5" stopColor="#2A2233" stopOpacity={0.14} /><Stop offset="0.75" stopColor="#fff" stopOpacity={0.55} /></LinearGradient></Defs><Path d="M28 0 L28 28 L0 28 Z" fill="url(#curl)" /></Svg></View>; }

export function Sticky({ id, color, title, body, meta, onPress }: { id: string; color: string; title?: string; body: string; meta: string; onPress: () => void }) {
  return (
    <Pressable onPress={() => { tap(); onPress(); }} style={({ pressed }) => ({ flex: 1, minHeight: 156, paddingTop: 22, paddingHorizontal: 14, paddingBottom: 12, backgroundColor: color, borderRadius: 3, transform: [{ rotate: (pressed ? 0 : tilt(id)) + 'deg' }, { scale: pressed ? 1.03 : 1 }], ...shadow(10, 0.24) })}>
      <Pin id={id} />
      {title ? <Txt tr={false} color={INK} style={{ fontFamily: HAND_B, fontSize: 22, lineHeight: 23 }} numberOfLines={2}>{title}</Txt> : null}
      <Txt tr={false} color={INK} numberOfLines={5} style={{ fontFamily: HAND, fontSize: 20, lineHeight: 23, marginTop: 4 }}>{body}</Txt>
      <Txt w={600} size={11} color={INK} tr={false} style={{ opacity: 0.6, marginTop: 'auto', paddingTop: 10, paddingRight: 22 }}>{meta}</Txt>
      <Curl />
    </Pressable>
  );
}
export function NoteSticky({ n, onPress }: { n: any; onPress: () => void }) {
  const items = n.items || [], done = items.filter((i: any) => i.d).length;
  return <Sticky id={n.id} color={ncol(n.c)} title={n.title} body={(n.body || items.map((i: any) => i.t).join(', ') || t('Empty note')).slice(0, 140)} meta={fmtWhen(n.updated) + (items.length ? `, ${done}/${items.length} ` + t('done') : '')} onPress={onPress} />;
}
export function Board({ children }: { children: React.ReactNode }) {
  const kids = React.Children.toArray(children); const rows: React.ReactNode[][] = [];
  for (let i = 0; i < kids.length; i += 2) rows.push(kids.slice(i, i + 2));
  return <View style={{ gap: 28, paddingTop: 14, paddingHorizontal: 4, paddingBottom: 6 }}>{rows.map((r, i) => <View key={i} style={{ flexDirection: 'row', gap: 18 }}>{r}{r.length < 2 ? <View style={{ flex: 1 }} /> : null}</View>)}</View>;
}
export function NoteCard({ n, onPress }: { n: any; onPress: () => void }) {
  const b = jbook(n.book), items = n.items || [], done = items.filter((i: any) => i.d).length;
  return (
    <Pressable onPress={() => { tap(); onPress(); }} style={({ pressed }) => ({ width: '100%', marginBottom: 12, backgroundColor: ncol(n.c), borderRadius: 24, padding: 14, opacity: pressed ? 0.9 : 1 })}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, opacity: 0.75, flexShrink: 1 }}><Icon name={b.icon} size={15} color={INK} /><Txt w={600} size={12} color={INK} tr={false} numberOfLines={1}>{t(b.name)}</Txt></View>
        {n.pin ? <Icon name="bookmark" size={15} color={INK} fill /> : null}
      </View>
      {n.title ? <Txt w={700} size={17} lh={1.2} color={INK} tr={false} style={{ marginTop: 10, marginBottom: 4 }}>{n.title}</Txt> : null}
      {n.body ? <Txt size={14} lh={1.45} color={INK} tr={false} numberOfLines={6} style={{ opacity: 0.85, marginTop: n.title ? 0 : 10 }}>{n.body.slice(0, 220)}</Txt> : null}
      {items.length ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}><Icon name="check" size={15} color={INK} /><Txt w={600} size={12.5} color={INK} tr={false}>{t(`${done} of ${items.length} done`)}</Txt></View> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10, alignItems: 'center' }}>
        <Txt size={12} color={INK} tr={false} style={{ opacity: 0.65 }}>{fmtWhen(n.updated)}</Txt>
        {n.mood ? <Pill txt={t(n.mood)} /> : null}
        {(n.tags || []).slice(0, 2).map((x: string) => <Pill key={x} txt={'#' + x} />)}
        {n.verse ? <Pill txt={n.verse} /> : null}
      </View>
    </Pressable>
  );
}
const Pill = ({ txt }: { txt: string }) => <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: 'rgba(42,34,51,0.09)' }}><Txt w={600} size={12} color={INK} tr={false}>{txt}</Txt></View>;
/* two-column masonry */
export function NGrid({ notes, open }: { notes: any[]; open: (id: string) => void }) {
  const a: any[] = [], b: any[] = []; let ha = 0, hb = 0;
  notes.forEach(n => { const h = 80 + Math.min(220, (n.body || '').length) * 0.5 + (n.title ? 30 : 0); if (ha <= hb) { a.push(n); ha += h; } else { b.push(n); hb += h; } });
  return <View style={{ flexDirection: 'row', gap: 12 }}>{[a, b].map((col, i) => <View key={i} style={{ flex: 1 }}>{col.map(n => <NoteCard key={n.id} n={n} onPress={() => open(n.id)} />)}</View>)}</View>;
}
/* fanned notebook covers */
export function BookCover({ b, pos, onPress }: { b: any; pos: 'l' | 'r' | 'front'; onPress: () => void }) {
  const ns = liveNotes().filter((n: any) => n.book === b.id), others = BICONS.filter(x => x !== b.icon).slice(hash(b.id) % 4, hash(b.id) % 4 + 2);
  const col = ncol(b.c);
  const tf = pos === 'l' ? [{ translateX: -78 }, { rotate: '-11deg' }, { scale: 0.86 }] : pos === 'r' ? [{ translateX: 78 }, { rotate: '11deg' }, { scale: 0.86 }] : [];
  return (
    <Pressable onPress={() => { tap(); onPress(); }} accessibilityLabel={pos === 'front' ? t(b.name) : t('Show') + ' ' + t(b.name)}
      style={{ position: 'absolute', width: 210, height: 262, borderRadius: 30, overflow: 'hidden', padding: 18, justifyContent: 'space-between', transform: tf as any, opacity: pos === 'front' ? 1 : 0.92, zIndex: pos === 'front' ? 2 : 1, ...shadow(14, 0.25) }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}><Svg width="100%" height="100%" viewBox="0 0 10 10" preserveAspectRatio="none"><Defs><LinearGradient id={'bk' + b.id} x1="0.2" y1="0" x2="0.8" y2="1"><Stop offset="0" stopColor="#fff" stopOpacity={1} /><Stop offset="0" stopColor={col} stopOpacity={0.45} /><Stop offset="1" stopColor={col} /></LinearGradient></Defs><Rect width="10" height="10" fill={col} /><Rect width="10" height="10" fill="#fff" opacity={0.35} /><Rect width="10" height="10" fill={`url(#bk${b.id})`} /></Svg></View>
      <View style={{ height: 140 }}>
        <Bub size={84} style={{ left: '50%', marginLeft: -42, top: 6 }} icon={b.icon} color="#E86A3A" isz={38} />
        <Bub size={54} style={{ left: 4, top: 82 }} icon={others[0] || 'heart'} color="#D6264F" isz={24} />
        <Bub size={46} style={{ right: 8, top: 88 }} icon={others[1] || 'spark'} color="#5B48E0" isz={20} />
      </View>
      <View><Txt w={700} size={20} lh={1.15} color={INK} tr={false}>{t(b.name)}</Txt><Txt size={13} color={INK} tr={false} style={{ opacity: 0.7 }}>{t(ns.length + (ns.length === 1 ? ' entry' : ' entries'))}</Txt></View>
    </Pressable>
  );
}
function Bub({ size, style, icon, color, isz }: { size: number; style: any; icon: string; color: string; isz: number }) { return <View style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center', ...shadow(8, 0.14) }, style]}><Icon name={icon} size={isz} color={color} /></View>; }
export { NC, fmtDate };
