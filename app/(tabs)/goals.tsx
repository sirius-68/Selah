import React from 'react';
import { View } from 'react-native';
import { useStore, mutate } from '@/lib/store';
import { CT, TCOL, TPLS, PH_THEME, ThemeKey } from '@/lib/content';
import { daysLabel, dayWord, nextOcc, pevery } from '@/lib/affirm';
import { hash, dateKey } from '@/lib/util';
import { fmtDate, fmtTime, t } from '@/lib/i18n';
import { TabScreen } from '@/ui/TabScreen';
import { Go, Switch, Title, Txt, useInk, useC } from '@/ui/kit';
import { Tile, Tiles, SubTxt } from '@/features/blocks';
import { openGoalEditor, PrayerCalendar } from '@/features/goals';
import { requestPerm, notifState } from '@/lib/notify';
import { Block } from '@/ui/kit';
import { doneDays } from '@/lib/affirm';

export default function Goals() {
  const S = useStore(); const c = useC();
  return (
    <TabScreen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 14, paddingBottom: 18 }}>
        <Title a="Your quiet" b="times." />
        <Go icon="plus" a11y="New goal" onPress={() => openGoalEditor()} style={{ backgroundColor: c.pill }} />
      </View>
      <GoalsBanner />
      {!S.goals.length ? (
        <>
          <Txt muted size={16} style={{ marginTop: -6, marginBottom: 18 }}>Start with one of these, or build your own.</Txt>
          <Tiles>{TPLS.map((tp, i) => { const k = TCOL[tp.theme]; return (
            <Tile key={i} k={k} v={i} photo={PH_THEME[tp.theme]} seed={i} tag={tp.theme} title={tp.name} sub={t(tp.d) + ', ' + t('at') + ' ' + fmtTime(tp.time)} onPress={() => openGoalEditor(null, { name: t(tp.name), theme: tp.theme, time: tp.time, period: tp.period })} />); })}</Tiles>
        </>
      ) : (
        <>
          <Tiles>{S.goals.map(g => { const k = TCOL[g.theme] || 'dusk', nx = nextOcc(g); const p = pevery(g.period); return (
            <Tile key={g.id} k={k} v={hash(g.id)} photo={PH_THEME[g.theme] || 'peace'} seed={hash(g.id)} tag={g.theme === 'any' ? 'Mixed' : g.theme} title={g.name} go="pencil" goPress={() => openGoalEditor(g)} goA11y={'Edit ' + g.name}
              sub={<><SubTxt tr={false}>{fmtTime(g.time) + ', ' + daysLabel(g.days)}</SubTxt><SubTxt tr={false}>{p.charAt(0).toUpperCase() + p.slice(1)}</SubTxt></>}
              footer={<GoalFoot on={g.on} label={g.on && nx ? t('Next:') + ' ' + dayWord(nx) : t('Reminders off')} k={k} onToggle={v => { mutate(s => { const x = s.goals.find(y => y.id === g.id); if (x) x.on = v; }); if (v && notifState() === 'undetermined') requestPerm(); }} name={g.name} />} />); })}</Tiles>
          <Txt muted size={14} style={{ marginTop: 14 }}>Reminders arrive 30 minutes before your time and again right at it.</Txt>
          <PrayerCalendar />
        </>
      )}
    </TabScreen>
  );
}
function GoalFoot({ on, label, onToggle, name, k }: { on: boolean; label: string; onToggle: (v: boolean) => void; name: string; k: string }) {
  const ink = useInk();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 12 }}>
      <Txt w={600} size={13} tr={false} style={{ flex: 1 }} numberOfLines={1}>{label}</Txt>
      <Switch value={on} onChange={onToggle} a11y={'Reminders for ' + name} ci={ink} cb={ink === '#fff' ? '#1d1626' : CT[k as ThemeKey].bg} />
    </View>
  );
}
/* this month's prayer days, over a photo */
function GoalsBanner() {
  const S = useStore(); if (!S.goals.length) return null;
  const now = new Date(), dd = doneDays(); let n = 0; for (let d = 1; d <= now.getDate(); d++) if (dd.has(dateKey(new Date(now.getFullYear(), now.getMonth(), d)))) n++;
  const slot = ['sunrise', 'valley', 'lake', 'mountain', 'woods', 'waterfall', 'aerial', 'peace', 'path', 'flowers', 'harvest', 'faith'][now.getMonth()];
  return (
    <Block k="dusk" photo={slot} radius={30} style={{ minHeight: 170, padding: 18, marginBottom: 20, justifyContent: 'flex-end' }}>
      <View style={{ alignSelf: 'flex-start', paddingHorizontal: 12, minHeight: 28, justifyContent: 'center', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 'auto' }}><Txt w={600} size={13} color="#fff" tr={false}>{fmtDate(now, { month: 'long' })}</Txt></View>
      <Txt w={700} size={30} lh={1.05} ls={-0.03} color="#fff" style={{ marginTop: 40 }}>{n ? t(`${n} day${n === 1 ? '' : 's'} with God`) : t('A new month with God')}</Txt>
      <Txt size={14} color="rgba(255,255,255,0.9)" style={{ marginTop: 4 }}>{S.goals.length === 1 ? '1 quiet time set' : `${S.goals.length} quiet times set`}</Txt>
    </Block>
  );
}
