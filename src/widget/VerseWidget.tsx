'use no memo';
/* The Android home-screen widget. Widgets cannot use hooks or normal
   React Native views, only the library's primitives. */
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { pickItem, WData } from './data';

type Hex = `#${string}`;
const hex = (c: string, fallback: Hex): Hex => (/^#[0-9a-fA-F]{6}$/.test(c) ? (c as Hex) : fallback);

export function VerseWidget({ d, width = 320, height = 160 }: { d: WData | null; width?: number; height?: number }) {
  const bg = hex(d?.w.bg || '', '#B6AEFF'), fg = hex(d?.w.fg || '', '#1E1446');
  const it = d ? pickItem(d) : null;
  const small = width < 220, tall = height > 200;
  const content = d?.w.content || 'both';
  const main = !it ? 'Open Selah to see today’s word.' : content === 'verse' ? '“' + it.v + '”' : it.a;
  const sub = it && content === 'both' && !small ? '“' + it.v + '”' : '';
  return (
    <FlexWidget clickAction="OPEN_APP"
      style={{ height: 'match_parent', width: 'match_parent', backgroundColor: bg, borderRadius: 26, padding: 16, flexDirection: 'column', justifyContent: 'space-between' }}>
      <TextWidget text={d?.brand || 'Selah'} style={{ fontSize: 12, fontWeight: '700', color: fg }} />
      <FlexWidget style={{ flexDirection: 'column', width: 'match_parent' }}>
        <TextWidget text={main} maxLines={small ? 5 : tall ? 7 : 3} truncate="END"
          style={{ fontSize: small ? 15 : 18, fontWeight: d?.w.font === 'serif' ? '400' : '700', color: fg }} />
        {sub ? <TextWidget text={sub} maxLines={tall ? 6 : 2} truncate="END" style={{ fontSize: 13, color: fg, marginTop: 4 }} /> : null}
        {it ? <TextWidget text={it.r} style={{ fontSize: 12, fontWeight: '700', color: fg, marginTop: 6 }} /> : null}
      </FlexWidget>
    </FlexWidget>
  );
}
