/* The web app's colour-block components: affirmation card, tile, continue
   card, pack card, list row and the little "pick up" cards. */
import React, { ReactNode } from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { Block, BTag, Go, Txt, useC, useInk, useOnPhoto, tap, ProgBar } from '../ui/kit';
import { Icon } from '../ui/Icon';
import { CT, ThemeKey } from '../lib/content';
import { block, hexA } from '../lib/theme';
import { t } from '../lib/i18n';

/* the big affirmation card */
export function AffCard({ k, v = 0, photo, seed, tag, tagTr = true, onGo, goA11y, aff, verse, refText, top = 196, children, style, affSize = 31 }: { k: ThemeKey | string; v?: number; photo?: string | null; seed?: number; tag?: string; tagTr?: boolean; onGo?: () => void; goA11y?: string; aff?: string; verse?: string; refText?: string; top?: number; children?: ReactNode; style?: StyleProp<ViewStyle>; affSize?: number }) {
  return (
    <Block k={k} v={v} photo={photo} seed={seed} style={[{ padding: 22, paddingTop: 20, paddingBottom: 24 }, style]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        {tag ? <BTag label={tag} tr={tagTr} /> : <View />}
        {onGo ? <Go onPress={onGo} a11y={goA11y || 'Read in the Bible'} /> : null}
      </View>
      <CardText aff={aff} verse={verse} refText={refText} top={onGo ? top - 28 : top} affSize={affSize} />
      {children}
    </Block>
  );
}
function CardText({ aff, verse, refText, top, affSize }: { aff?: string; verse?: string; refText?: string; top: number; affSize: number }) {
  const ink = useInk(); const ph = useOnPhoto();
  return (
    <View style={{ paddingTop: top }}>
      {aff ? <Txt w={700} size={affSize} lh={1.08} ls={-0.03} tr={false} style={ph ? shadowTxt : undefined}>{aff}</Txt> : null}
      {verse ? <Txt size={16.5} lh={1.5} tr={false} color={ph ? 'rgba(255,255,255,0.9)' : hexA(toHex(ink), 0.86)} style={{ marginTop: 16 }}>{'“' + verse + '”'}</Txt> : null}
      {refText ? <Txt w={700} size={14} tr={false} style={{ marginTop: 14 }}>{refText}</Txt> : null}
    </View>
  );
}
const toHex = (c: string) => c.startsWith('#') ? c : '#ffffff';
export const shadowTxt = { textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 18, textShadowOffset: { width: 0, height: 2 } };

/* half-width tile with ribbon/photo, go button and text at the bottom */
export function Tile({ k, v = 0, photo, seed, tag, title, sub, onPress, go = 'arrow', goFill, goPress, goA11y, footer, wide, minH = 220, small, selected, a11y, tr = true }: { k: ThemeKey | string; v?: number; photo?: string | null; seed?: number; tag?: string; title: string; sub?: string | ReactNode; onPress?: () => void; go?: string | null; goFill?: boolean; goPress?: () => void; goA11y?: string; footer?: ReactNode; wide?: boolean; minH?: number; small?: boolean; selected?: boolean; a11y?: string; tr?: boolean }) {
  return (
    <Block k={k} v={v} photo={photo} seed={seed} onPress={onPress} a11y={a11y || title} radius={28} selected={selected}
      art={wide ? { size: 322, right: -76, top: -126 } : { size: 238, right: -82, top: -78 }}
      style={{ minHeight: small ? 110 : minH, padding: 14, paddingBottom: 16, flex: wide ? undefined : 1 }}>
      {go ? <View style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}><Go icon={go} size={42} fill={goFill} onPress={goPress} a11y={goA11y} /></View> : null}
      <View style={{ marginTop: 'auto', paddingTop: small ? 40 : 96 }}>
        {tag ? <BTag label={tag} tr={tr} /> : null}
        <Txt w={700} size={20} lh={1.1} ls={-0.02} tr={tr} style={{ marginTop: 8, marginBottom: 4 }}>{title}</Txt>
        {typeof sub === 'string' ? <SubTxt>{sub}</SubTxt> : sub}
        {footer}
      </View>
    </Block>
  );
}
export function SubTxt({ children, size = 13.5, tr = true }: { children: ReactNode; size?: number; tr?: boolean }) { const ink = useInk(); return <Txt size={size} lh={1.35} tr={tr} color={hexA(toHex(ink), 0.85)}>{children}</Txt>; }
export function Tiles({ children, gap = 12 }: { children: ReactNode; gap?: number }) {
  const kids = React.Children.toArray(children); const rows: ReactNode[][] = [];
  for (let i = 0; i < kids.length; i += 2) rows.push(kids.slice(i, i + 2));
  return <View style={{ gap }}>{rows.map((r, i) => <View key={i} style={{ flexDirection: 'row', gap }}>{r}{r.length < 2 ? <View style={{ flex: 1 }} /> : null}</View>)}</View>;
}

/* the wide "continue" card */
export function Cont({ k, v = 0, photo, seed, small, title, onPress, go = 'arrow', goFill, style, a11y, tr = true, children }: { k: ThemeKey | string; v?: number; photo?: string | null; seed?: number; small?: string; title: string; onPress?: () => void; go?: string; goFill?: boolean; style?: StyleProp<ViewStyle>; a11y?: string; tr?: boolean; children?: ReactNode }) {
  return (
    <Block k={k} v={v} photo={photo} seed={seed} onPress={onPress} a11y={a11y || title} radius={30} art={{ size: 322, right: -76, top: -126, fade: false }}
      style={[{ minHeight: 150, padding: 18, paddingBottom: 20, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 20 }, style]}>
      <View style={{ flex: 1 }}>
        {small ? <ContSmall tr={tr}>{small}</ContSmall> : null}
        <Txt w={700} size={30} lh={1.05} ls={-0.03} tr={tr} style={{ marginTop: 4 }}>{title}</Txt>
        {children}
      </View>
      <Go icon={go} fill={goFill} />
    </Block>
  );
}
function ContSmall({ children, tr }: { children: ReactNode; tr: boolean }) { const ink = useInk(); return <Txt w={600} size={14} tr={tr} color={hexA(toHex(ink), 0.8)}>{children}</Txt>; }

/* pack card on the shelf */
export function PackCard({ p, tag, done, wide, onPress, photo }: { p: { id: string; k: ThemeKey; t1: string; t2: string; blurb: string }; tag: string; done: number; wide?: boolean; onPress: () => void; photo?: string | null }) {
  return (
    <Block k={p.k} v={p.id.length} photo={photo} onPress={onPress} a11y={p.t1 + ' ' + p.t2} radius={30} art={{ size: 320, right: -110, top: -120 }}
      style={{ width: wide ? undefined : 260, minHeight: wide ? 270 : 250, padding: 18, paddingTop: 16, marginBottom: wide ? 12 : 0 }}>
      <BTag label={tag} tr={false} />
      <View style={{ marginTop: 'auto', paddingTop: 70 }}>
        <Txt w={700} size={24} lh={1.04} ls={-0.025}>{t(p.t1) + '\n' + t(p.t2)}</Txt>
        <View style={{ marginTop: 8 }}><SubTxt size={14}>{p.blurb}</SubTxt></View>
        <PackProg done={done} />
      </View>
    </Block>
  );
}
function PackProg({ done }: { done: number }) { const ink = useInk(); return <ProgBar pct={done / 7} color={ink} track={hexA(toHex(ink), 0.22)} h={6} style={{ marginTop: 14 }} />; }

/* list row with a coloured icon square (Explore) */
export function XRow({ k, icon, title, status, pill, onPress, tr = true }: { k: ThemeKey | string; icon: string; title: string; status: string; pill?: string; onPress: () => void; tr?: boolean }) {
  const c = useC(); const { cb, ci } = block(k);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={t(title)} onPress={() => { tap(); onPress(); }} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 76, paddingVertical: 12, paddingLeft: 12, paddingRight: 14, borderRadius: 24, backgroundColor: c.surface, opacity: pressed ? 0.9 : 1 })}>
      <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: cb, alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={24} color={ci} /></View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt w={700} size={17} lh={1.2} tr={tr}>{title}</Txt>
        <Txt muted size={13.5} lh={1.35} tr={false} style={{ marginTop: 3 }}>{status}</Txt>
      </View>
      {pill ? <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: '#F4F01E' }}><Txt w={700} size={12} color="#17101F">{pill}</Txt></View> : null}
      <Icon name="chevr" size={18} color={c.muted} />
    </Pressable>
  );
}
/* plain list row (notebooks, watches) */
export function ListRow({ left, title, sub, right, onPress, tr = true }: { left?: ReactNode; title: string; sub?: string; right?: ReactNode; onPress?: () => void; tr?: boolean }) {
  const c = useC();
  const inner = <>{left}<View style={{ flex: 1, minWidth: 0 }}><Txt w={700} size={16.5} tr={tr}>{title}</Txt>{sub ? <Txt muted size={13.5} tr={false} style={{ marginTop: 2 }}>{sub}</Txt> : null}</View>{right}</>;
  const st = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, padding: 14, borderRadius: 22, backgroundColor: c.surface };
  if (!onPress) return <View style={st}>{inner}</View>;
  return <Pressable onPress={() => { tap(); onPress(); }} style={({ pressed }) => [st, { opacity: pressed ? 0.9 : 1 }]}>{inner}</Pressable>;
}
/* dashed "add" row */
export function Upl({ icon, title, body, onPress, lav }: { icon: string; title: string; body: string; onPress: () => void; lav?: boolean }) {
  const c = useC();
  return (
    <Pressable onPress={() => { tap(); onPress(); }} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 24, backgroundColor: c.surface, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.line, opacity: pressed ? 0.9 : 1 })}>
      <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: lav ? '#B6AEFF' : c.pill, alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} color={lav ? '#1E1446' : c.onPill} /></View>
      <View style={{ flex: 1 }}><Txt w={700}>{title}</Txt><Txt muted size={14} style={{ marginTop: 2 }}>{body}</Txt></View>
    </Pressable>
  );
}
export { CT };
