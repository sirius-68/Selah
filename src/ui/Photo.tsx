import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { PH, phUrl } from '../lib/content';

const failed = new Set<string>();
export const photoIds = (slot: string, seed = 0) => { const ids = PH[slot] || PH.peace, i = Math.abs(seed) % ids.length; return ids.slice(i).concat(ids.slice(0, i)).filter(id => !failed.has(id)); };

/* A full-bleed photo with the dark reading gradient over it. Tries each photo
   in the slot; if all fail it calls onFail so the card can fall back to colour. */
export function Photo({ slot, seed = 0, onFail, overlay = 'card', width = 900 }: { slot: string; seed?: number; onFail?: () => void; overlay?: 'card' | 'welcome' | 'none'; width?: number }) {
  const [list, setList] = useState(() => photoIds(slot, seed));
  const [gid] = useState(() => 'pg' + Math.random().toString(36).slice(2, 8));
  if (!list.length) return null;
  const stops = overlay === 'welcome'
    ? [[0, 0.55], [0.28, 0.05], [0.52, 0.35], [0.78, 0.92], [1, 1]]
    : [[0, 0.42], [0.3, 0.06], [0.58, 0.38], [1, 0.84]];
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Image
        source={{ uri: phUrl(list[0], width) }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={250}
        cachePolicy="disk"
        onError={() => { failed.add(list[0]); const rest = list.slice(1); setList(rest); if (!rest.length) onFail && onFail(); }}
      />
      {overlay !== 'none' ? (
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 10 10">
          <Defs>
            <LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              {stops.map(([o, a], i) => <Stop key={i} offset={o} stopColor={overlay === 'welcome' ? '#0A0610' : '#0C0812'} stopOpacity={a} />)}
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="10" height="10" fill={`url(#${gid})`} />
        </Svg>
      ) : null}
    </View>
  );
}

let FID = 0;
/* a vertical fade from transparent to a colour (photo edges into the page) */
export function FadeTo({ color, from = 0 }: { color: string; from?: number }) {
  const [id] = useState(() => 'fd' + (++FID));
  return (
    <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 10 10">
      <Defs><LinearGradient id={id} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={color} stopOpacity={from} /><Stop offset="1" stopColor={color} stopOpacity={1} /></LinearGradient></Defs>
      <Rect x="0" y="0" width="10" height="10" fill={`url(#${id})`} />
    </Svg>
  );
}
