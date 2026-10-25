import React from 'react';
import { Pressable, View } from 'react-native';
import { useStore, mutate } from '@/lib/store';
import { URK } from '@/lib/content';
import { countdown, dayWord, daysLabel } from '@/lib/affirm';
import { fmtLen, nextWatch, prayStreak, urVerses, weekStats } from '@/lib/ur';
import { fmtTime, plural, t } from '@/lib/i18n';
import { fmtWhen } from '@/lib/journal';
import { Page, go } from '@/ui/overlay';
import { Block, BTag, Btn, LinkBtn, Mini, Switch, Title, Txt, useC, tap } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { Tile, Tiles, SubTxt, Upl } from '@/features/blocks';
import { startPrayer } from '@/features/urEngine';
import { openHeard } from '@/features/urSheets';

export default function UpperRoom() {
  const S = useStore(); const c = useC();
  const st = weekStats(0), nw = nextWatch();
  return (
    <Page title="" back={false} right={<Btn sm icon="goals" label="Insights" onPress={() => go('/insights', { o: '0' })} />}>
      <Title a="The upper" b="room." />
      <Txt muted size={16} style={{ marginTop: 6, marginBottom: 18 }}>“Enter into thy closet, and when thou hast shut thy door, pray.” Matthew 6:6</Txt>
      <Block k="night" v={1} photo="night" radius={36} onPress={() => startPrayer('session')} a11y="Start praying now" style={{ padding: 22, paddingTop: 18, paddingBottom: 26 }} art={{ size: 440, right: -150, top: -140 }}>
        <BTag label="Open prayer" />
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12, paddingTop: 110 }}>
          <View style={{ flex: 1 }}>
            <Txt w={700} size={30} lh={1.08} color="#fff">Start praying now</Txt>
            <Txt size={15} color="rgba(255,255,255,0.9)" style={{ marginTop: 4 }}>Worship and peace scriptures with a soft hymn pad</Txt>
          </View>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><Icon name="play" color="#17101F" fill size={26} /></View>
        </View>
      </Block>
      <Pressable onPress={() => go('/insights', { o: '0' })} style={{ flexDirection: 'row', marginTop: 12, borderRadius: 24, backgroundColor: c.surface, padding: 14 }}>
        {[[fmtLen(st.secs), 'prayed this week'], [String(prayStreak()), 'day streak'], [st.prayDays + '/7', 'days with God']].map(([b, l], i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}><Txt w={700} size={20} tr={false}>{b}</Txt><Txt muted size={12.5} center>{l}</Txt></View>))}
      </Pressable>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 30, paddingBottom: 12 }}>
        <Txt w={700} size={21}>Prayer sessions</Txt><LinkBtn label="New session" onPress={() => go('/ur/edit', { k: 'session' })} />
      </View>
      {S.ur.sessions.length ? <Tiles>{S.ur.sessions.map((s: any, i: number) => { const k = URK[(s.themes || [])[0]] || 'dusk', nv = urVerses(s).length; return (
        <Tile key={s.id} k={k} v={i + 2} tag={(s.themes || []).slice(0, 2).map((x: string) => t(x)).join(', ') || t('Custom')} tr={false} title={s.name} go="pencil" goPress={() => go('/ur/edit', { k: 'session', id: s.id })} goA11y={'Edit ' + s.name}
          sub={<SubTxt tr={false}>{[t(plural(nv, 'verse')), t(plural(s.playlist.length, 'track')), s.target ? t(s.target + ' min') : ''].filter(Boolean).join(', ')}</SubTxt>}
          footer={<Pressable onPress={() => startPrayer('session', s.id)} style={{ flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 6, marginTop: 12, minHeight: 36, paddingHorizontal: 14, borderRadius: 999, backgroundColor: '#fff' }}><Icon name="play" size={16} color="#17101F" fill /><Txt w={600} size={14} color="#17101F">Begin</Txt></Pressable>} />); })}</Tiles>
        : <Upl icon="plus" title="Create a prayer session" body="Pick scripture themes like faith, warfare or worship, and a playlist to pray with." onPress={() => go('/ur/edit', { k: 'session' })} />}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 30, paddingBottom: 12 }}>
        <Txt w={700} size={21}>Prayer watches</Txt><LinkBtn label="New watch" onPress={() => go('/ur/edit', { k: 'watch' })} />
      </View>
      {nw ? <Txt muted size={13.5} tr={false} style={{ marginTop: -4, marginBottom: 12 }}>{t('Next:') + ' ' + nw.w.name + ', ' + dayWord(nw.d).toLowerCase() + ' ' + t('at') + ' ' + fmtTime(nw.w.time) + ' (' + countdown(nw.d) + ').'}</Txt> : null}
      {S.ur.watches.length ? <View style={{ gap: 8 }}>{S.ur.watches.slice().sort((a: any, b: any) => a.time.localeCompare(b.time)).map((w: any) => (
        <View key={w.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 22, backgroundColor: c.surface }}>
          <Pressable onPress={() => go('/ur/edit', { k: 'watch', id: w.id })} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ minWidth: 64, paddingVertical: 8, paddingHorizontal: 8, borderRadius: 14, backgroundColor: '#B6AEFF', alignItems: 'center' }}><Txt w={700} size={14} color="#1E1446" tr={false}>{fmtTime(w.time)}</Txt></View>
            <View style={{ flex: 1 }}><Txt w={700} tr={false}>{w.name}</Txt><Txt muted size={13} tr={false}>{daysLabel(w.days) + ', ' + t(w.dur + ' min') + (w.on ? '' : ', ' + t('reminders off'))}</Txt></View>
          </Pressable>
          <Pressable accessibilityLabel={t('Start') + ' ' + w.name} onPress={() => startPrayer('watch', w.id)} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}><Icon name="play" size={18} color={c.ink} fill /></Pressable>
          <Switch value={w.on} a11y={'Reminders for ' + w.name} onChange={v => mutate(s => { const x = s.ur.watches.find((y: any) => y.id === w.id); if (x) x.on = v; })} />
        </View>))}</View>
        : <Upl icon="moon" title="Set a prayer watch" body="Choose a time and days to rise and pray, with its own scriptures and music." onPress={() => go('/ur/edit', { k: 'watch' })} lav />}
      {S.ur.logs.length ? <>
        <Txt w={700} size={21} style={{ paddingTop: 30, paddingBottom: 12 }}>Recent prayer</Txt>
        {S.ur.logs.slice(0, 5).map((l: any) => (
          <View key={l.id} style={{ backgroundColor: c.surface, borderRadius: 26, padding: 18, paddingBottom: 14, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Icon name={l.kind === 'watch' ? 'moon' : 'heart'} size={18} color={c.ink} /><Txt w={700} tr={false}>{l.name}</Txt></View>
            <Txt muted size={14} tr={false} style={{ marginTop: 4 }}>{fmtWhen(l.start) + ', ' + fmtLen(l.secs) + (l.silence ? ', ' + fmtLen(l.silence) + ' ' + t('of silence') : '')}</Txt>
            {l.heard ? <View style={{ marginTop: 12, padding: 12, paddingHorizontal: 14, borderRadius: 18, backgroundColor: c.surface2 }}><Txt size={15} tr={false}>{l.heard}</Txt></View>
              : <Mini items={[['pencil', 'Write what you heard', () => openHeard(l)]]} />}
          </View>))}
      </> : null}
    </Page>
  );
}
