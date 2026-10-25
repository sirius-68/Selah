import React, { useEffect, useReducer } from 'react';
import { BackHandler, Pressable, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { router, useLocalSearchParams } from 'expo-router';
import { useStore } from '@/lib/store';
import { fmtClock } from '@/lib/util';
import { refShow, t } from '@/lib/i18n';
import { plName } from '@/lib/ur';
import { DARK_ROOM } from '@/lib/theme';
import { useTick } from '@/lib/hooks';
import { ColorsCtx, Btn, Chip, Txt, BTag, Block, InkScope } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { Page } from '@/ui/overlay';
import { UR, endPrayer, onRun, startPrayer, trackPos, urNext, urPauseToggle, urPrev, urRepeatCycle, urSeekTo, urSkip, urTick, urToggleScripture } from '@/features/urEngine';
import { openSilence } from '@/features/urSheets';

export default function Run() {
  const S = useStore(); const [, f] = useReducer(x => x + 1, 0); useTick(500);
  const p = useLocalSearchParams<{ k?: string; id?: string }>();
  useEffect(() => { if (!UR.run && p.k) startPrayer(p.k, p.id || null, false); return onRun(f); }, []);
  useEffect(() => { urTick(); });
  const end = () => { const log = endPrayer(); router.back(); if (log) setTimeout(() => openSilence(log), 450); };
  useEffect(() => { const sub = BackHandler.addEventListener('hardwareBackPress', () => { end(); return true; }); return () => sub.remove(); }, []);
  const r = UR.run; const c = DARK_ROOM;
  if (!r) return <ColorsCtx.Provider value={c}><Page title="Upper room" back={false} bg={c.bg}><Txt muted>This prayer has ended.</Txt></Page></ColorsCtx.Provider>;
  const s = (Date.now() - r.start) / 1000, has = r.playlist.length, playing = has && r.musicOn && !r.paused, it = has ? r.playlist[r.pi] : null, pos = trackPos();
  return (
    <ColorsCtx.Provider value={c}>
      <Page title={r.kind === 'watch' ? 'Prayer watch' : 'Upper room'} back={false} onBack={end} bg={c.bg}>
        <Txt w={600} size={17} center tr={false} color={c.muted} style={{ marginTop: 6 }}>{r.name}</Txt>
        <Txt w={300} size={72} ls={-0.04} center tr={false}>{fmtClock(s)}</Txt>
        {r.target ? <>
          <View style={{ height: 6, borderRadius: 6, backgroundColor: c.surface2, overflow: 'hidden', marginTop: 4 }}><View style={{ width: `${Math.min(100, s / (r.target * 60) * 100)}%`, height: '100%', backgroundColor: '#B6AEFF' }} /></View>
          <Txt muted size={13.5} center tr={false} style={{ marginTop: 8 }}>{s < r.target * 60 ? fmtClock(r.target * 60 - s) + ' ' + t('left of') + ' ' + t(r.target + ' min') : t(`${r.target} minutes reached. Keep going as long as you like.`)}</Txt>
        </> : <Txt muted size={13.5} center style={{ marginTop: 6 }}>Pray as long as you need</Txt>}
        <Block k="dusk" v={2} style={{ marginTop: 22, padding: 22, paddingTop: 20, paddingBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <BTag label="Scripture" />
            <Pressable accessibilityRole="switch" accessibilityState={{ checked: r.scrOn }} accessibilityLabel={t('Read scripture aloud')} onPress={urToggleScripture} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 12, paddingRight: 4, height: 34, borderRadius: 999, backgroundColor: 'rgba(30,20,70,0.12)' }}>
              <Txt w={600} size={13} color="#1E1446">{r.scrOn ? 'Read aloud' : 'Silent'}</Txt>
              <View style={{ width: 40, height: 26, borderRadius: 13, backgroundColor: r.scrOn ? '#1E1446' : 'rgba(30,20,70,0.25)', padding: 3 }}><View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', transform: [{ translateX: r.scrOn ? 14 : 0 }] }} /></View>
            </Pressable>
          </View>
          <View style={{ paddingTop: 100 }}>
            {r.cur ? <>
              <Txt w={700} size={23} lh={1.2} ls={-0.02} tr={false}>{'“' + r.cur.text + '”'}</Txt>
              <Txt w={700} size={14} tr={false} style={{ marginTop: 14 }}>{refShow(r.cur.ref)}</Txt>
            </> : <Txt w={700} size={22} lh={1.2}>Settle your heart. The first verse is coming.</Txt>}
          </View>
        </Block>
        <View style={{ marginTop: 18, padding: 18, borderRadius: 28, backgroundColor: c.surface }}>
          <Txt w={700} size={17} tr={false} numberOfLines={1}>{has ? plName(it) : t('No music in this session')}</Txt>
          <Txt muted size={13} tr={false} numberOfLines={1}>{has ? t(`Track ${r.pi + 1} of ${r.playlist.length}`) + (r.playlist.length > 1 ? ', ' + t('up next:') + ' ' + plName(r.playlist[(r.pi + 1) % r.playlist.length]) : '') : t('Add music when you edit this session')}</Txt>
          <Slider style={{ marginTop: 10 }} minimumValue={0} maximumValue={1} value={pos && pos.dur ? Math.min(1, pos.cur / pos.dur) : pos && pos.live ? 1 : 0} disabled={!pos || !pos.dur} onSlidingComplete={v => urSeekTo(v)} minimumTrackTintColor="#B6AEFF" maximumTrackTintColor={c.line} thumbTintColor="#F4EFF8" />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Txt muted size={12.5} tr={false}>{pos ? fmtClock(pos.cur) : '0:00'}</Txt>
            <Txt muted size={12.5} tr={false}>{pos ? (pos.live ? t('Continuous') : pos.dur ? '-' + fmtClock(Math.max(0, pos.dur - pos.cur)) : '--:--') : '0:00'}</Txt>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <Pressable accessibilityLabel={t(S.ur.repeat === 'all' ? 'Repeat playlist (tap to repeat one track)' : S.ur.repeat === 'one' ? 'Repeat this track (tap to turn repeat off)' : 'Repeat off (tap to repeat the playlist)')} onPress={urRepeatCycle} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="repeat" color={S.ur.repeat !== 'off' ? '#B6AEFF' : c.muted} />
              {S.ur.repeat === 'one' ? <Txt w={800} size={10} color="#B6AEFF" tr={false} style={{ position: 'absolute', top: 6, right: 8 }}>1</Txt> : null}
            </Pressable>
            <Pressable disabled={!has} accessibilityLabel={t('Previous track')} onPress={urPrev} style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center', opacity: has ? 1 : 0.4 }}><Icon name="prev" color={c.ink} fill size={26} /></Pressable>
            <Pressable disabled={!has} accessibilityLabel={t(playing ? 'Pause music' : 'Play music')} onPress={urPauseToggle} style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: '#F4EFF8', alignItems: 'center', justifyContent: 'center', opacity: has ? 1 : 0.4 }}><Icon name={playing ? 'pause' : 'play'} color="#130D1B" fill={!playing} size={28} stroke={2.4} /></Pressable>
            <Pressable disabled={!has} accessibilityLabel={t('Next track')} onPress={urNext} style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center', opacity: has ? 1 : 0.4 }}><Icon name="next" color={c.ink} fill size={26} /></Pressable>
            <View style={{ width: 48 }} />
          </View>
          {it && it.t === 'my' ? <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 10 }}>
            <Chip icon="chevl" label="15 sec" tr={false} onPress={() => urSkip(-15)} /><Chip label="15 sec" tr={false} icon="chevr" onPress={() => urSkip(15)} />
          </View> : null}
        </View>
        <Btn kind="primary" icon="check" label="Amen, end prayer" style={{ marginTop: 22, minHeight: 60, backgroundColor: '#FFB0D4' }} onPress={end} />
      </Page>
    </ColorsCtx.Provider>
  );
}
