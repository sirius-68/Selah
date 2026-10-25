/* After prayer: a timed moment of silence, then "What did you hear?". */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { mutate, S } from '../lib/store';
import { fmtClock } from '../lib/util';
import { fmtDate, t } from '../lib/i18n';
import { fmtLen } from '../lib/ur';
import { newNote, urBook, ncol } from '../lib/journal';
import { chime } from '../lib/sound';
import { Btn, Chip, Input, Txt, useC } from '../ui/kit';
import { Icon } from '../ui/Icon';
import { closeSheet, openSheet, SheetTitle, toast } from '../ui/overlay';

export function openSilence(log: any) { openSheet(<Silence log={log} />, { locked: true }); }
function Silence({ log }: { log: any }) {
  const c = useC(); const [len, setLen] = useState(60); const [end, setEnd] = useState(0); const [start, setStart] = useState(0); const [, f] = useState(0);
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => { const l = Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }), Animated.timing(pulse, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })])); l.start(); return () => l.stop(); }, []);
  useEffect(() => { if (!end) return; const i = setInterval(() => { f(x => x + 1); if (Date.now() >= end) { clearInterval(i); chime(); } }, 250); return () => clearInterval(i); }, [end]);
  const left = end ? Math.max(0, Math.ceil((end - Date.now()) / 1000)) : len;
  return (
    <View>
      <View style={{ alignSelf: 'flex-start', paddingHorizontal: 12, minHeight: 28, justifyContent: 'center', borderRadius: 999, backgroundColor: c.surface2 }}><Txt w={600} size={13}>{log.kind === 'watch' ? 'Prayer watch' : 'Prayer session'}</Txt></View>
      <Txt w={300} size={56} ls={-0.04} tr={false} style={{ marginTop: 10 }}>{fmtClock(log.secs)}</Txt>
      <Txt muted tr={false}>{t('You prayed for') + ' ' + fmtLen(log.secs) + (log.name ? ', ' + log.name : '') + '.'}</Txt>
      <SheetTitle style={{ marginTop: 22, marginBottom: 6 }}>Be still.</SheetTitle>
      <Txt muted style={{ marginBottom: 6 }}>“Be still, and know that I am God.” Psalm 46:10. Observe a moment of silence and listen.</Txt>
      <View style={{ height: 210, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={{ width: 150, height: 150, borderRadius: 75, backgroundColor: '#B6AEFF', alignItems: 'center', justifyContent: 'center', transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.08] }) }] }}>
          <Txt w={700} size={26} color="#1E1446" tr={false}>{end && !left ? t('Amen') : fmtClock(left)}</Txt>
        </Animated.View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
        {[[60, '1 min'], [120, '2 min'], [300, '5 min']].map(([s, l]) => <Chip key={s} label={l as string} on={len === s} onPress={() => setLen(s as number)} />)}
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Btn label={end ? 'Restart silence' : 'Begin silence'} style={{ flex: 1 }} onPress={() => { setStart(Date.now()); setEnd(Date.now() + len * 1000); }} />
        <Btn kind="primary" label="Done" style={{ flex: 1 }} onPress={() => { if (start) { const secs = Math.round((Math.min(Date.now(), end) - start) / 1000); mutate(s => { const l = s.ur.logs.find((x: any) => x.id === log.id); if (l) l.silence = secs; }); } closeSheet(); setTimeout(() => openHeard(log), 350); }} />
      </View>
    </View>
  );
}
export function openHeard(log: any) { openSheet(<Heard log={log} />, { locked: true }); }
function Heard({ log }: { log: any }) {
  const [tx, setTx] = useState('');
  return (
    <View>
      <SheetTitle>What did you hear?</SheetTitle>
      <Txt muted style={{ marginTop: -8, marginBottom: 14 }}>Write down what you sensed in the quiet: a word, a verse, a picture, a direction.</Txt>
      <View style={{ backgroundColor: ncol('butter'), borderRadius: 6, padding: 16, paddingTop: 14 }}>
        <Txt w={600} size={13} color="#6B5E3A" tr={false}>{fmtDate(log.start, { weekday: 'long', month: 'long', day: 'numeric' }) + ', ' + log.name}</Txt>
        <Input multi minH={200} value={tx} onChangeText={setTx} placeholder="I heard…" autoFocus style={{ backgroundColor: 'transparent', color: '#2A2233', paddingHorizontal: 0, borderWidth: 0 }} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 12 }}><Icon name="journal" size={16} color="#A99EB7" /><Txt muted size={13.5}>Saved to My journal, in your Upper room notebook.</Txt></View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Btn label="Skip for now" style={{ flex: 1 }} onPress={() => { closeSheet(); toast('Prayer saved. You can add what you heard later.'); }} />
        <Btn kind="primary" label="Save to notebook" style={{ flex: 1 }} onPress={() => {
          const v = tx.trim(); if (!v) { toast('Write a few words, or tap Skip for now'); return; }
          mutate(s => { const l = s.ur.logs.find((x: any) => x.id === log.id); if (l) l.heard = v; urBook(); });
          newNote({ book: urBook().id, c: 'lilac', title: `${log.name}, ${fmtDate(log.start, { month: 'short', day: 'numeric' })}`, body: v, tags: ['heard'], mood: 'Peaceful' });
          closeSheet(); toast('Saved to your Upper room notebook');
        }} />
      </View>
    </View>
  );
}
export { S };
