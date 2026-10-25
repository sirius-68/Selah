import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import icons from '../data/icons.json';

const IC: Record<string, [string, Record<string, string>][]> = icons as any;
export type IconName = keyof typeof icons | string;

/* The web app's 24px line icons, drawn natively. */
export function Icon({ name, size = 22, color = '#000', fill = false, stroke = 1.9 }: { name: IconName; size?: number; color?: string; fill?: boolean; stroke?: number }) {
  const els = IC[name as string] || [];
  const common = { stroke: color, strokeWidth: stroke, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: fill ? color : 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {els.map(([tag, a], i) => {
        if (tag === 'circle') return <Circle key={i} cx={a.cx} cy={a.cy} r={a.r} {...common} />;
        if (tag === 'rect') return <Rect key={i} x={a.x} y={a.y} width={a.width} height={a.height} rx={a.rx} {...common} />;
        return <Path key={i} d={a.d} {...common} />;
      })}
    </Svg>
  );
}
