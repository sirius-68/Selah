import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import { useStore, mutate } from '@/lib/store';
import { PH_SCAPE, SCAPES } from '@/lib/content';
import { isPlus } from '@/lib/affirm';
import { fmtDur, fmtMB } from '@/lib/util';
import { t } from '@/lib/i18n';
import { SND, leftLabel, playScape, scapeInfo, setTimerMin, setVoice, setVolume, stopScape } from '@/lib/sound';
import { MY, myTracks, pickTracks, removeTrack, renameTrack } from '@/lib/tracks';
import { useSound, useTick } from '@/lib/hooks';
import { Page, closeSheet, openSheet, SheetTitle, toast } from '@/ui/overlay';
import { Block, BTag, Btn, Chip, Chips, Field, IconBtn, Input, SetRow, Switch, Title, Txt, useC, tap } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { Tile, Tiles, Upl } from '@/features/blocks';
import { suspendLock } from '@/features/lock';

export default function Audio() {
  const S = useStore(); const c = useC(); useSound(); useTick(1000);
  const [armed, setArmed] = useState<string | null>(null);
  const cur = scapeInfo(S.scape.id), plus = isPlus(), mine = myTracks();
  const toggle = () => { if (SND.playing) stopScape(); else { if (!cur.free && !cur.user && !plus) { router.push('/paywall'); return; } if (cur.user && !plus) { router.push('/paywall'); return; } playScape(cur.id); } };
  return (
    <Page title="Sleep Scapes" back={false}>
      <Title a="Rest in" b="His word." style={{ marginTop: 6, marginBottom: 20 }} />
      <Block k={cur.k} v={2} photo={cur.user ? 'night' : PH_SCAPE[cur.id] || 'night'} radius={36} style={{ padding: 22, paddingTop: 18, paddingBottom: 24 }} art={{ size: 440, right: -150, top: -140 }}>
        <BTag label={SND.playing ? 'Now playing' : 'Ready'} />
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12, paddingTop: 100 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt w={700} size={26} lh={1.1} color="#fff" tr={!cur.user}>{cur.n}</Txt>
            <Txt size={15} color="rgba(255,255,255,0.9)" tr={false} style={{ marginTop: 6 }}>{SND.line || t(SND.playing ? (S.scape.voice ? 'An affirmation will be read shortly…' : 'Breathe slowly and rest.') : 'Press play and settle in.')}</Txt>
            <Txt size={13.5} color="rgba(255,255,255,0.85)" tr={false} style={{ marginTop: 6 }}>{leftLabel()}</Txt>
          </View>
          <Pressable accessibilityLabel={t(SND.playing ? 'Pause' : 'Play')} onPress={() => { tap(); toggle(); }} style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><Icon name={SND.playing ? 'pause' : 'play'} color="#17101F" fill={!SND.playing} size={28} stroke={2.4} /></Pressable>
        </View>
      </Block>
      <Txt w={600} size={14} style={{ marginTop: 24, marginBottom: 10 }}>Sleep timer</Txt>
      <Chips style={{ marginBottom: 20 }}>{[[0, 'Off'], [15, '15 min'], [30, '30 min'], [60, '60 min']].map(([m, l]) => <Chip key={m} label={l as string} on={S.scape.timer === m} onPress={() => setTimerMin(m as number)} />)}</Chips>
      <SetRow title="Spoken affirmations" sub="Read aloud softly about every 40 seconds" right={<Switch value={S.scape.voice} a11y="Spoken affirmations" onChange={setVoice} />} />
      <Field label="Volume"><Slider minimumValue={0} maximumValue={1} step={0.05} value={S.scape.vol} onValueChange={setVolume} onSlidingComplete={() => mutate(() => {})} minimumTrackTintColor={c.accent} maximumTrackTintColor={c.line} thumbTintColor={c.accent} /></Field>
      <Txt w={600} size={14} style={{ marginBottom: 10 }}>Scapes</Txt>
      <Tiles>{SCAPES.map((s, i) => { const lk = !s.free && !plus; return (
        <Tile key={s.id} k={s.k} v={i} photo={PH_SCAPE[s.id]} seed={i} selected={S.scape.id === s.id} tag={s.free ? 'Free' : lk ? 'Plus' : 'Unlocked'} title={s.n} sub={s.s} go={lk ? 'lock' : 'play'} goFill={!lk}
          onPress={() => { if (lk) { router.push('/paywall'); toast('This scape comes with Selah Plus'); return; } mutate(st => { st.scape.id = s.id; }); if (SND.playing) playScape(s.id); }} />); })}</Tiles>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 28, paddingBottom: 12 }}>
        <Txt w={700} size={21}>Your sounds</Txt>
        {plus ? <Txt muted size={13.5} tr={false}>{t(`${mine.length} of ${MY.max}`)}</Txt> : <View style={{ backgroundColor: '#B6AEFF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}><Txt w={700} size={12} color="#1E1446">Plus</Txt></View>}
      </View>
      <Upl icon={plus ? 'plus' : 'lock'} title={plus ? 'Add your own audio' : 'Upload your own meditation audio'} body={plus ? t(`MP3, M4A, WAV or OGG, up to ${MY.maxMB} MB each`) : t('Play your recordings with the sleep timer and spoken affirmations. Included with Selah Plus.')}
        onPress={async () => { if (!plus) { router.push('/paywall'); toast('Uploading your own audio comes with Selah Plus'); return; } suspendLock(); const r = await pickTracks(); r.msgs.forEach(m => toast(m)); if (r.ids.length) toast(r.ids.length === 1 ? 'Sound added' : r.ids.length + ' sounds added'); }} />
      {mine.length ? <View style={{ gap: 8, marginTop: 12 }}>{mine.map(tr => { const id = 'u:' + tr.id, on = SND.playing && SND.cur === id, sel = S.scape.id === id; return (
        <View key={tr.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 22, backgroundColor: c.surface, borderWidth: sel ? 2 : 0, borderColor: '#F4F01E' }}>
          <Pressable accessibilityLabel={t(on ? 'Pause' : 'Play') + ' ' + tr.name} onPress={() => { if (!plus) { router.push('/paywall'); return; } if (on) stopScape(); else { mutate(s => { s.scape.id = id; }); playScape(id); } }} style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: '#23C25F', alignItems: 'center', justifyContent: 'center' }}><Icon name={on ? 'pause' : 'play'} color="#06341B" fill={!on} /></Pressable>
          <View style={{ flex: 1, minWidth: 0 }}><Txt w={700} tr={false} numberOfLines={1}>{tr.name}</Txt><Txt muted size={13} tr={false}>{[fmtDur(tr.dur), fmtMB(tr.size)].filter(Boolean).join(', ') + (on ? ', ' + t('playing') : '')}</Txt></View>
          <IconBtn name="pencil" size={38} a11y={'Rename ' + tr.name} onPress={() => openSheet(<Rename id={tr.id} name={tr.name} />)} />
          {armed === tr.id ? <Pressable onPress={async () => { setArmed(null); if (SND.cur === id) stopScape(true); await removeTrack(tr.id); if (S.scape.id === id) mutate(s => { s.scape.id = 'rain'; }); toast('Sound removed'); }} style={{ height: 38, paddingHorizontal: 12, borderRadius: 19, backgroundColor: c.danger, justifyContent: 'center' }}><Txt w={700} size={12} color="#fff">Delete?</Txt></Pressable>
            : <IconBtn name="x" size={38} a11y={'Delete ' + tr.name} onPress={() => { setArmed(tr.id); setTimeout(() => setArmed(a => a === tr.id ? null : a), 3500); }} />}
        </View>); })}</View>
        : plus ? <Txt muted size={13.5} style={{ marginTop: 12 }}>Record a prayer, a favourite worship song or your own guided meditation, then add it here.</Txt> : null}
      <Txt muted size={13.5} center style={{ marginTop: 18 }}>Scapes play on your device, even with the screen off.</Txt>
    </Page>
  );
}
function Rename({ id, name }: { id: string; name: string }) {
  const [v, setV] = useState(name);
  return <View><SheetTitle>Rename sound</SheetTitle><Field label="Name"><Input value={v} onChangeText={setV} maxLength={60} autoFocus selectTextOnFocus /></Field>
    <Btn kind="primary" block label="Save name" onPress={() => { if (!v.trim()) { toast('Give your sound a name'); return; } renameTrack(id, v.trim()); closeSheet(); toast('Renamed'); }} /></View>;
}
