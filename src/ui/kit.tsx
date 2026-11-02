/* Building blocks that mirror the web app's CSS components. */
import React, { createContext, ReactNode, useContext, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleProp, StyleSheet, Text, TextInput, TextInputProps, TextStyle, View, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, F, HAND, SERIF, block, hexA } from '../lib/theme';
import { t } from '../lib/i18n';
import { Icon } from './Icon';
import { Ribbon } from './Ribbon';
import { Photo } from './Photo';
import { ThemeKey } from '../lib/content';

export const ColorsCtx = createContext<Colors>(null as any);
export const useC = () => useContext(ColorsCtx);
/* text colour inherited from a colour block (like CSS "color: var(--ci)") */
const InkCtx = createContext<string | null>(null);
export const useInk = () => { const c = useC(); const ink = useContext(InkCtx); return ink || c.ink; };
export function InkScope({ color, children }: { color: string; children: ReactNode }) { return <InkCtx.Provider value={color}>{children}</InkCtx.Provider>; }

export const tap = () => { Haptics.selectionAsync().catch(() => {}); };

type TxtProps = { children?: ReactNode; w?: number; size?: number; lh?: number; color?: string; muted?: boolean; style?: StyleProp<TextStyle>; serif?: boolean; hand?: boolean; tr?: boolean; numberOfLines?: number; center?: boolean; ls?: number; selectable?: boolean; onPress?: () => void };
/* Text in Bricolage Grotesque. Plain strings are translated unless tr={false}. */
export function Txt({ children, w = 400, size = 16, lh, color, muted, style, serif, hand, tr = true, numberOfLines, center, ls, selectable, onPress }: TxtProps) {
  const c = useC(); const ink = useInk();
  const kids = tr ? React.Children.map(children, ch => typeof ch === 'string' ? t(ch) : ch) : children;
  return (
    <Text onPress={onPress} selectable={selectable} numberOfLines={numberOfLines} allowFontScaling
      style={[{ fontFamily: serif ? SERIF : hand ? HAND : F[w] || F[400], fontSize: size, lineHeight: lh ? Math.round(lh * size) : undefined, color: color || (muted ? c.muted : ink), letterSpacing: ls != null ? ls * size : undefined, textAlign: center ? 'center' : undefined }, style]}>
      {kids}
    </Text>
  );
}
/* the big two-weight title: "Let's go / deeper." */
export function Title({ a, b, size = 44, style, color, inline }: { a: string; b: string; size?: number; style?: StyleProp<TextStyle>; color?: string; inline?: boolean }) {
  const ink = useInk();
  return (
    <Text style={[{ fontFamily: F[300], fontSize: size, lineHeight: Math.round(size * 1.02), letterSpacing: -0.035 * size, color: color || ink }, style]}>
      {t(a)}{inline ? ' ' : '\n'}<Text style={{ fontFamily: F[700] }}>{t(b)}</Text>
    </Text>
  );
}
export function H2({ children, style, size = 21 }: { children: ReactNode; style?: StyleProp<TextStyle>; size?: number }) { return <Txt w={700} size={size} lh={1.15} ls={-0.02} style={style}>{children}</Txt>; }
export function Lead({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) { return <Txt muted size={16} lh={1.5} style={[{ marginTop: 10, marginBottom: 18 }, style]}>{children}</Txt>; }
export function Fine({ children, style, center = true }: { children: ReactNode; style?: StyleProp<TextStyle>; center?: boolean }) { return <Txt muted size={13.5} lh={1.45} center={center} style={[{ marginTop: 12 }, style]}>{children}</Txt>; }
export function Lbl({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) { return <Txt w={600} size={14} style={[{ marginBottom: 10 }, style]}>{children}</Txt>; }

type BtnProps = { label?: string; children?: ReactNode; onPress?: () => void; kind?: 'primary' | 'default' | 'danger' | 'lemon' | 'leaf'; sm?: boolean; block?: boolean; icon?: string; iconFill?: boolean; disabled?: boolean; busy?: boolean; style?: StyleProp<ViewStyle>; tr?: boolean; a11y?: string };
export function Btn({ label, children, onPress, kind = 'default', sm, block: blk, icon, iconFill, disabled, busy, style, tr = true, a11y }: BtnProps) {
  const c = useC();
  const bg = kind === 'primary' ? c.pill : kind === 'lemon' ? '#F4F01E' : kind === 'leaf' ? '#23C25F' : c.surface2;
  const fg = kind === 'primary' ? c.onPill : kind === 'lemon' ? '#17101F' : kind === 'leaf' ? '#06341B' : kind === 'danger' ? c.danger : c.ink;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={a11y || (label ? t(label) : undefined)} disabled={disabled || busy} onPress={() => { tap(); onPress && onPress(); }}
      style={({ pressed }) => [{ minHeight: sm ? 40 : 52, paddingHorizontal: sm ? 16 : 22, borderRadius: 999, backgroundColor: bg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: disabled ? 0.45 : pressed ? 0.85 : 1, alignSelf: blk ? 'stretch' : undefined }, style]}>
      {busy ? <ActivityIndicator size="small" color={fg} /> : icon ? <Icon name={icon} size={sm ? 18 : 20} color={fg} fill={iconFill} /> : null}
      {label ? <Txt w={600} size={sm ? 14.5 : 16} color={fg} tr={tr} numberOfLines={2} center>{label}</Txt> : null}
      {children}
    </Pressable>
  );
}
export function LinkBtn({ label, onPress, color, style, tr = true, size = 15 }: { label: string; onPress: () => void; color?: string; style?: StyleProp<ViewStyle>; tr?: boolean; size?: number }) {
  const c = useC();
  return <Pressable hitSlop={8} onPress={() => { tap(); onPress(); }} style={style}><Txt w={600} size={size} color={color || c.accent} tr={tr}>{label}</Txt></Pressable>;
}
export function IconBtn({ name, onPress, a11y, size = 46, bg, color, fill, style, children }: { name?: string; onPress?: () => void; a11y: string; size?: number; bg?: string; color?: string; fill?: boolean; style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  const c = useC();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={t(a11y)} hitSlop={4} onPress={() => { tap(); onPress && onPress(); }}
      style={({ pressed }) => [{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: bg || c.surface2, opacity: pressed ? 0.8 : 1 }, style]}>
      {name ? <Icon name={name} size={size > 40 ? 22 : 18} color={color || c.ink} fill={fill} /> : children}
    </Pressable>
  );
}
/* the white circle arrow button on colour blocks */
export function Go({ icon = 'arrow', size = 48, onPress, a11y, fill, dark, style }: { icon?: string; size?: number; onPress?: () => void; a11y?: string; fill?: boolean; dark?: boolean; style?: StyleProp<ViewStyle> }) {
  const inner = <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: dark ? '#17101F' : '#fff', alignItems: 'center', justifyContent: 'center', ...shadow(6, 0.16) }, style]}><Icon name={icon} size={size > 44 ? 22 : 18} color={dark ? '#F4F01E' : '#17101F'} fill={fill} /></View>;
  if (!onPress) return inner;
  return <Pressable accessibilityRole="button" accessibilityLabel={a11y ? t(a11y) : undefined} hitSlop={6} onPress={() => { tap(); onPress(); }}>{inner}</Pressable>;
}
export function Chip({ label, on, onPress, icon, sm, style, tr = true, a11y }: { label?: string; on?: boolean; onPress?: () => void; icon?: string; sm?: boolean; style?: StyleProp<ViewStyle>; tr?: boolean; a11y?: string }) {
  const c = useC();
  const fg = on ? '#4A0A14' : c.ink;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!on }} accessibilityLabel={a11y ? t(a11y) : undefined} onPress={() => { tap(); onPress && onPress(); }}
      style={({ pressed }) => [{ minHeight: sm ? 36 : 42, paddingHorizontal: label ? (sm ? 14 : 18) : 12, borderRadius: 999, backgroundColor: on ? '#FFB0D4' : c.surface2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: pressed ? 0.85 : 1 }, style]}>
      {icon ? <Icon name={icon} size={18} color={fg} /> : null}
      {label ? <Txt w={on ? 600 : 500} size={sm ? 14 : 15} color={fg} tr={tr}>{label}</Txt> : null}
    </Pressable>
  );
}
export function Chips({ children, scroll, style }: { children: ReactNode; scroll?: boolean; style?: StyleProp<ViewStyle> }) {
  if (scroll) return <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[{ marginHorizontal: -16, flexGrow: 0 }, style]} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>{children}</ScrollView>;
  return <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, style]}>{children}</View>;
}
export function Seg<T extends string | number>({ options, value, onChange, style }: { options: [T, string][]; value: T; onChange: (v: T) => void; style?: StyleProp<ViewStyle> }) {
  const c = useC();
  return (
    <View style={[{ flexDirection: 'row', gap: 6, padding: 5, borderRadius: 999, backgroundColor: c.surface2 }, style]}>
      {options.map(([k, l]) => { const on = k === value; return (
        <Pressable key={String(k)} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => { tap(); onChange(k); }} style={{ flex: 1, minHeight: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, backgroundColor: on ? c.pill : 'transparent' }}>
          <Txt w={on ? 600 : 500} size={15} color={on ? c.onPill : c.muted} numberOfLines={1}>{l}</Txt>
        </Pressable>); })}
    </View>
  );
}
export function Switch({ value, onChange, a11y, cb, ci }: { value: boolean; onChange: (v: boolean) => void; a11y: string; cb?: string; ci?: string }) {
  const c = useC();
  const track = ci ? (value ? ci : hexA(ci, 0.22)) : value ? c.pill : c.line;
  const knob = ci ? (value ? cb! : '#fff') : value ? c.onPill : '#fff';
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: value }} accessibilityLabel={t(a11y)} hitSlop={8} onPress={() => { tap(); onChange(!value); }}
      style={{ width: 50, height: 30, borderRadius: 999, backgroundColor: track, justifyContent: 'center', paddingHorizontal: 3 }}>
      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: knob, transform: [{ translateX: value ? 20 : 0 }], ...shadow(1, 0.3) }} />
    </Pressable>
  );
}
export function Tag({ label, ci, style, tr = true, photo }: { label: string; ci?: string; style?: StyleProp<ViewStyle>; tr?: boolean; photo?: boolean }) {
  const ink = useInk(); const col = photo ? '#fff' : ci || ink;
  return <View style={[{ alignSelf: 'flex-start', minHeight: 28, paddingHorizontal: 12, borderRadius: 999, justifyContent: 'center', backgroundColor: photo ? 'rgba(255,255,255,0.2)' : hexA(col, 0.14) }, style]}><Txt w={600} size={13} color={col} tr={tr} numberOfLines={1}>{label}</Txt></View>;
}
export function SetRow({ title, sub, right, style }: { title: string; sub?: string; right: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }, style]}>
      <View style={{ flex: 1 }}><Txt w={600} size={16}>{title}</Txt>{sub ? <Txt muted size={14} style={{ marginTop: 2 }}>{sub}</Txt> : null}</View>
      {right}
    </View>
  );
}
export function Field({ label, children, style, hint }: { label?: string; children: ReactNode; style?: StyleProp<ViewStyle>; hint?: string }) {
  return <View style={[{ marginBottom: 20 }, style]}>{label ? <Txt w={600} size={14} style={{ marginBottom: 8 }}>{label}</Txt> : null}{children}{hint ? <Txt muted size={13.5} style={{ marginTop: 6 }}>{hint}</Txt> : null}</View>;
}
export const Input = React.forwardRef<TextInput, TextInputProps & { multi?: boolean; minH?: number; bad?: boolean; tr?: boolean }>(function Input({ multi, minH, bad, style, placeholder, tr = true, ...p }, ref) {
  const c = useC(); const [focus, setFocus] = useState(false);
  return (
    <TextInput ref={ref} placeholder={placeholder && tr ? t(placeholder) : placeholder} placeholderTextColor={c.muted} multiline={multi} textAlignVertical={multi ? 'top' : 'center'}
      onFocus={e => { setFocus(true); p.onFocus && p.onFocus(e); }} onBlur={e => { setFocus(false); p.onBlur && p.onBlur(e); }}
      style={[{ minHeight: multi ? (minH || 120) : 52, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 18, backgroundColor: c.surface2, color: c.ink, fontFamily: F[400], fontSize: 16, lineHeight: multi ? 24 : undefined, borderWidth: 1.5, borderColor: bad ? c.danger : focus ? c.accent : 'transparent' }, style]}
      {...p} />
  );
});
export function SecH({ title, right, style, size = 21 }: { title: string; right?: ReactNode; style?: StyleProp<ViewStyle>; size?: number }) {
  return <View style={[{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, paddingTop: 14, paddingBottom: 18 }, style]}><H2 size={size}>{title}</H2>{right}</View>;
}
export function Empty({ title, body }: { title: string; body: string }) {
  return <View style={{ paddingVertical: 40, paddingHorizontal: 12, alignItems: 'center' }}><Txt w={700} size={22} ls={-0.02} style={{ marginBottom: 6 }} center>{title}</Txt><Txt muted center size={16} lh={1.5}>{body}</Txt></View>;
}
export function Surface({ children, style, onPress, a11y }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; a11y?: string }) {
  const c = useC();
  const st = [{ backgroundColor: c.surface, borderRadius: 26, padding: 18 }, style];
  if (onPress) return <Pressable accessibilityRole="button" accessibilityLabel={a11y ? t(a11y) : undefined} onPress={() => { tap(); onPress(); }} style={({ pressed }) => [st, { opacity: pressed ? 0.9 : 1 }]}>{children}</Pressable>;
  return <View style={st}>{children}</View>;
}
/* little action pills (.mini) */
export function Mini({ items }: { items: [string, string, () => void][] }) {
  const c = useC();
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>{items.map(([icon, label, fn], i) => (
    <Pressable key={i} onPress={() => { tap(); fn(); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, paddingHorizontal: 12, borderRadius: 999, backgroundColor: c.surface2 }}>
      <Icon name={icon} size={17} color={c.muted} /><Txt w={500} size={13.5} color={c.muted}>{label}</Txt></Pressable>))}</View>;
}
export function OkMsg({ title, body, warn, style }: { title?: string; body: string; warn?: boolean; style?: StyleProp<ViewStyle> }) {
  const c = useC();
  return <View style={[{ padding: 16, borderRadius: 22, backgroundColor: warn ? hexA('#FFB0D4', c.dark ? 0.2 : 0.45) : c.surface2, marginBottom: 18 }, style]}>{title ? <Txt w={700} size={15.5} style={{ marginBottom: 4 }}>{title}</Txt> : null}<Txt size={15} lh={1.45}>{body}</Txt></View>;
}
export function ProgBar({ pct, color, track, h = 8, style }: { pct: number; color?: string; track?: string; h?: number; style?: StyleProp<ViewStyle> }) {
  const c = useC();
  return <View style={[{ height: h, borderRadius: h, backgroundColor: track || c.surface2, overflow: 'hidden' }, style]}><View style={{ width: `${Math.max(0, Math.min(100, pct * 100))}%`, height: '100%', borderRadius: h, backgroundColor: color || c.accent }} /></View>;
}

export function shadow(y: number, a: number): ViewStyle { return { shadowColor: '#0A0514', shadowOpacity: a, shadowRadius: y * 2, shadowOffset: { width: 0, height: y }, elevation: Math.round(y * 1.2) }; }

/* ---------- colour blocks (cards, tiles, continue cards, heroes) ---------- */
type BlockProps = { k: ThemeKey | string; v?: number; photo?: string | null; seed?: number; style?: StyleProp<ViewStyle>; children: ReactNode; onPress?: () => void; a11y?: string; art?: { size: number; right: number; top: number; fade?: boolean }; radius?: number; selected?: boolean };
/* A colour block with ribbon art, or a photo when a slot is given. Children
   read text colour from InkScope (white on photos, the theme ink otherwise). */
export function Block({ k, v = 0, photo, seed = 0, style, children, onPress, a11y, art = { size: 434, right: -136, top: -128 }, radius = 34, selected }: BlockProps) {
  const { cb, ci } = block(k); const [fail, setFail] = useState(false);
  const usePhoto = !!photo && !fail;
  const ink = usePhoto ? '#fff' : ci;
  const body = (
    <InkScope color={ink}>
      <PhotoFlag.Provider value={usePhoto}>
        {usePhoto ? <Photo slot={photo!} seed={seed} onFail={() => setFail(true)} /> : <Ribbon k={k} v={v} size={art.size} fade={art.fade !== false} style={{ right: art.right, top: art.top }} />}
        {children}
      </PhotoFlag.Provider>
    </InkScope>
  );
  const st: StyleProp<ViewStyle> = [{ borderRadius: radius, overflow: 'hidden', backgroundColor: usePhoto ? '#1d1626' : cb }, selected ? { borderWidth: 3, borderColor: '#F4F01E' } : null, style];
  if (onPress) return <Pressable accessibilityRole="button" accessibilityLabel={a11y ? t(a11y) : undefined} onPress={() => { tap(); onPress(); }} style={({ pressed }) => [st as any, { transform: [{ scale: pressed ? 0.985 : 1 }] }]}>{body}</Pressable>;
  return <View style={st}>{body}</View>;
}
export const PhotoFlag = createContext(false);
export const useOnPhoto = () => useContext(PhotoFlag);
/* the tag pill inside a block (white glass on photos) */
export function BTag({ label, tr = true, style }: { label: string; tr?: boolean; style?: StyleProp<ViewStyle> }) { const p = useOnPhoto(); return <Tag label={label} tr={tr} photo={p} style={style} />; }

export const S_ = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  grow: { flex: 1, minWidth: 0 },
});
