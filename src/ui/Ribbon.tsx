import React, { useRef } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Svg, { Defs, G, LinearGradient, Mask, Path, Rect, Stop } from 'react-native-svg';
import { CT, RP, ThemeKey } from '../lib/content';

let RID = 0;
/* The two-stroke ribbon art that sits on every colour block. */
export function Ribbon({ k, v = 0, size, fade = true, style }: { k: ThemeKey | string; v?: number; size: number; fade?: boolean; style?: StyleProp<ViewStyle> }) {
  const ids = useRef<string[] | null>(null);
  if (!ids.current) { const n = ++RID; ids.current = ['ra' + n, 'rb' + n, 'rs' + n, 'rm' + n, 'rf' + n]; }
  const [a, b, s, m, f] = ids.current;
  const T = CT[k as ThemeKey] || CT.dusk, p = RP[((v % RP.length) + RP.length) % RP.length];
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="-60 -60 420 420">
        <Defs>
          <LinearGradient id={a} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={T.r1[0]} /><Stop offset="1" stopColor={T.r1[1]} /></LinearGradient>
          <LinearGradient id={b} x1="1" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={T.r2[0]} /><Stop offset="1" stopColor={T.r2[1]} /></LinearGradient>
          <LinearGradient id={s} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#fff" stopOpacity={0.5} /><Stop offset="0.55" stopColor="#fff" stopOpacity={0} /></LinearGradient>
          {fade ? <LinearGradient id={f} x1="0" y1="0" x2="0" y2="1"><Stop offset="0.55" stopColor="#fff" stopOpacity={1} /><Stop offset="0.88" stopColor="#fff" stopOpacity={0} /></LinearGradient> : null}
          {fade ? <Mask id={m} x="-60" y="-60" width="420" height="420" maskUnits="userSpaceOnUse"><Rect x="-60" y="-60" width="420" height="420" fill={`url(#${f})`} /></Mask> : null}
        </Defs>
        <G mask={fade ? `url(#${m})` : undefined} fill="none" strokeLinecap="round">
          <Path d={p[1]} stroke={`url(#${b})`} strokeWidth={64} fill="none" strokeLinecap="round" />
          <Path d={p[0]} stroke={`url(#${a})`} strokeWidth={74} fill="none" strokeLinecap="round" />
          <Path d={p[0]} stroke={`url(#${s})`} strokeWidth={74} fill="none" strokeLinecap="round" />
        </G>
      </Svg>
    </View>
  );
}

/* the round brand mark */
export function Mark({ size = 40 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: CT.dusk.bg }}>
      <Ribbon k="dusk" v={0} size={size} fade={false} style={{ left: 0, top: 0 }} />
    </View>
  );
}
