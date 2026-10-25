/* Hand-drawn scenes for the "Pick up where you left off" cards. */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Mask, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { CT, ThemeKey } from '../lib/content';

let XI = 0;
const AnimCircle = Animated.createAnimatedComponent(Circle);
function Twinkle(p: { cx: number; cy: number; r: number; fill: string; delay: number }) {
  const a = useRef(new Animated.Value(1)).current;
  useEffect(() => { const l = Animated.loop(Animated.sequence([Animated.delay(p.delay), Animated.timing(a, { toValue: 0.35, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: false }), Animated.timing(a, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: false })])); l.start(); return () => l.stop(); }, []);
  return <AnimCircle cx={p.cx} cy={p.cy} r={p.r} fill={p.fill} opacity={a as any} />;
}
const star = (x: number, y: number, r: number) => `M${x} ${y - r * 2} L${x + r * .6} ${y - r * .6} L${x + r * 2} ${y} L${x + r * .6} ${y + r * .6} L${x} ${y + r * 2} L${x - r * .6} ${y + r * .6} L${x - r * 2} ${y} L${x - r * .6} ${y - r * .6}Z`;

export function XIllo({ type, k, pid, height = 128 }: { type: 'pledge' | 'check' | 'watch' | 'pack'; k: ThemeKey; pid?: string; height?: number }) {
  const [id] = useState(() => 'xi' + (++XI));
  const c = CT[k] || CT.dusk, ink = c.t, cream = '#FFF6EA';
  const fade = <LinearGradient id={id + 'f'} x1="0" y1="0" x2="0" y2="1"><Stop offset="0.72" stopColor={c.bg} stopOpacity={0} /><Stop offset="1" stopColor={c.bg} stopOpacity={1} /></LinearGradient>;
  let defs: React.ReactNode = null, art: React.ReactNode = null;
  if (type === 'pledge') {
    defs = <LinearGradient id={id + 's'} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={c.r2[0]} /><Stop offset="1" stopColor={c.bg} /></LinearGradient>;
    art = <G>
      <Rect width="200" height="120" fill={`url(#${id}s)`} />
      <G stroke={c.r2[1]} strokeWidth={3} strokeLinecap="round" opacity={0.55}>{[...Array(9)].map((_, i) => { const a = Math.PI * (i / 8), x = Math.cos(a), y = Math.sin(a); return <Line key={i} x1={100 - x * 46} y1={86 - y * 46} x2={100 - x * 66} y2={86 - y * 66} />; })}</G>
      <Circle cx={100} cy={86} r={40} fill={c.r2[1]} opacity={0.25} /><Circle cx={100} cy={86} r={30} fill={c.r2[1]} />
      <Path d="M0 92 C40 70 70 78 104 92 S170 78 200 88 V120 H0Z" fill={c.r1[0]} />
      <Path d="M0 104 C50 90 90 112 140 100 S190 96 200 100 V120 H0Z" fill={c.r1[1]} />
      <G fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round"><Path d="M38 34 q6 -6 12 0 q6 -6 12 0" /><Path d="M150 22 q4 -4 8 0 q4 -4 8 0" /></G>
    </G>;
  } else if (type === 'check') {
    art = <G>
      <Circle cx={160} cy={26} r={44} fill={c.r1[1]} opacity={0.18} />
      <G fill={c.r2[0]}>{[[24, 22, 3], [40, 70, 2], [178, 92, 2.5], [120, 14, 2]].map(([x, y, r], i) => <Path key={i} d={star(x, y, r)} />)}</G>
      <G transform="rotate(-7 92 66) translate(-14 0)">
        <Rect x={56} y={22} width={76} height={84} rx={12} fill={cream} />
        <Path d="M56 34 a12 12 0 0 1 12 -12 h52 a12 12 0 0 1 12 12 v8 h-76z" fill={c.r1[1]} />
        <G fill={c.t} opacity={0.18}>{[0, 1, 2, 3].map(r => [0, 1, 2, 3, 4].map(q => <Circle key={r + '-' + q} cx={68 + q * 13} cy={54 + r * 13} r={3} />))}</G>
        <Rect x={74} y={16} width={5} height={14} rx={2.5} fill={ink} /><Rect x={110} y={16} width={5} height={14} rx={2.5} fill={ink} />
        <Circle cx={106} cy={80} r={17} fill={c.r2[1]} />
        <Path d="M98 80 l6 6 l11 -12" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      </G>
      <Path d="M150 64 c0 -6 8 -8 10 -2 c2 -6 10 -4 10 2 c0 7 -10 12 -10 12 s-10 -5 -10 -12z" fill={c.r1[0]} />
    </G>;
  } else if (type === 'watch') {
    defs = <>
      <RadialGradient id={id + 'g'} cx="0.5" cy="0.5" r="0.5"><Stop offset="0" stopColor="#FFC66B" stopOpacity={0.55} /><Stop offset="1" stopColor="#FFC66B" stopOpacity={0} /></RadialGradient>
      <Mask id={id + 'm'} x="0" y="0" width="200" height="120" maskUnits="userSpaceOnUse"><Rect width="200" height="120" fill="#fff" /><Circle cx={122} cy={26} r={17} fill="#000" /></Mask>
    </>;
    art = <G>
      <Circle cx={112} cy={34} r={34} fill={c.t} opacity={0.08} />
      <Circle cx={112} cy={34} r={19} fill={c.t} mask={`url(#${id}m)`} />
      {[[20, 18, 1.6], [48, 40, 1.1], [78, 14, 1.4], [104, 46, 1], [186, 60, 1.3], [118, 22, 0.9], [34, 62, 1]].map(([x, y, r], i) => <Twinkle key={i} cx={x} cy={y} r={r} fill={c.t} delay={i * 400} />)}
      <Path d="M0 98 C40 80 80 90 120 84 S180 76 200 82 V120 H0Z" fill={c.r2[0]} />
      <Circle cx={74} cy={64} r={34} fill={`url(#${id}g)`} />
      <Rect x={66} y={70} width={16} height={34} rx={4} fill={cream} /><Rect x={58} y={102} width={32} height={6} rx={3} fill={c.r1[0]} />
      <Line x1={74} y1={70} x2={74} y2={64} stroke={ink} strokeWidth={1.5} opacity={0.6} />
      <Path d="M74 46 C80 54 81 60 74 64 C67 60 68 54 74 46Z" fill="#FFC66B" />
      <Path d="M74 54 C77 58 77 61 74 63 C71 61 71 58 74 54Z" fill="#fff" opacity={0.85} />
    </G>;
  } else {
    defs = <RadialGradient id={id + 'g'} cx="0.5" cy="0.9" r="0.5"><Stop offset="0" stopColor={cream} stopOpacity={0.6} /><Stop offset="1" stopColor={cream} stopOpacity={0} /></RadialGradient>;
    const top = pid === 'loss' ? <G>
      <Path d="M100 86 V54" stroke="#1E8A47" strokeWidth={3} strokeLinecap="round" /><Path d="M100 76 C90 76 84 70 84 62 C94 62 100 68 100 76Z" fill="#23C25F" />
      <G fill="#FF8FB8">{[0, 72, 144, 216, 288].map(a => <Ellipse key={a} cx={100} cy={38} rx={6} ry={10} transform={`rotate(${a} 100 48)`} />)}</G><Circle cx={100} cy={48} r={5} fill="#FFC66B" />
    </G> : pid === 'mothers' ? <Path d="M100 82 c0 -14 -22 -20 -22 -34 c0 -9 12 -13 22 -4 c10 -9 22 -5 22 4 c0 14 -22 20 -22 34z" fill="#FF5F95" />
      : pid === 'work' ? <G><Circle cx={100} cy={52} r={24} fill="#FFC66B" opacity={0.3} /><Circle cx={100} cy={52} r={16} fill="#FFC66B" /></G>
      : <G><Path d="M100 86 V54" stroke="#1E8A47" strokeWidth={3} strokeLinecap="round" /><Path d="M100 70 C88 70 80 62 80 52 C92 52 100 60 100 70Z" fill="#23C25F" /><Path d="M100 62 C112 62 122 54 122 42 C108 42 100 50 100 62Z" fill="#2FD86E" /></G>;
    art = <G>
      <G stroke={c.r2[1]} strokeWidth={2.5} strokeLinecap="round" opacity={0.5}>{[-60, -35, -12, 12, 35, 60].map(a => { const r = a * Math.PI / 180; return <Line key={a} x1={100 + Math.sin(r) * 34} y1={76 - Math.cos(r) * 34} x2={100 + Math.sin(r) * 58} y2={76 - Math.cos(r) * 58} />; })}</G>
      <Ellipse cx={100} cy={86} rx={70} ry={40} fill={`url(#${id}g)`} />
      <Path d="M100 86 C80 76 56 76 36 82 V106 C56 100 80 100 100 110Z" fill={cream} />
      <Path d="M100 86 C120 76 144 76 164 82 V106 C144 100 120 100 100 110Z" fill="#F3E6D3" />
      <G stroke={ink} strokeWidth={1.4} opacity={0.25} strokeLinecap="round" fill="none"><Path d="M46 88 q22 -6 44 0M46 95 q22 -6 44 0M110 88 q22 -6 44 0M110 95 q22 -6 44 0" /></G>
      {top}
    </G>;
  }
  return (
    <Svg width="100%" height={height} viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
      <Defs>{defs}{fade}</Defs>
      {art}
      <Rect width="200" height="120" fill={`url(#${id}f)`} />
    </Svg>
  );
}
