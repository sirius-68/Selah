import React, { useEffect, useReducer } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useStore, mutate } from '@/lib/store';
import { DEMO, greet, isPlus } from '@/lib/affirm';
import { agendaItems, fmtLen, weekStats } from '@/lib/ur';
import { dateKey, pad, weekStart, DAY } from '@/lib/util';
import { fmtDate, fmtTime, t } from '@/lib/i18n';
import { notifState, onAlerts, refreshPerm, requestPerm } from '@/lib/notify';
import { TabScreen } from '@/ui/TabScreen';
import { Btn, LinkBtn, Title, Txt, useC, tap } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { go } from '@/ui/overlay';
import { Cont } from '@/features/blocks';
import { GoalBlock, openGoalEditor } from '@/features/goals';
import { startPrayer } from '@/features/urEngine';
import { useTick } from '@/lib/hooks';

export default function Today() {
  const S = useStore(); const c = useC(); useTick(60000);
  const [, f] = useReducer(x => x + 1, 0); useEffect(() => { refreshPerm(); return onAlerts(f); }, []);
  const now = new Date(); const [a, b] = greet();
  const goals = [...S.goals].sort((x, y) => (x.time || '').localeCompare(y.time || ''));
  return (
    <TabScreen>
      <View style={{ paddingTop: 14, paddingBottom: 22 }}>
        <Txt muted size={15} tr={false} style={{ marginBottom: 10 }}>{fmtDate(now, { weekday: 'long', month: 'long', day: 'numeric' })}</Txt>
        <Title a={a} b={b} />
      </View>
      <NotifBanner />
      <WeeklyCard />
      <Agenda />
      {!goals.length ? (
        <View style={{ marginBottom: 30 }}>
          <Txt muted size={16} lh={1.5} style={{ marginBottom: 18 }}>Pick what you want to grow in and when you pray. Selah brings you a scripture affirmation at that time.</Txt>
          <Btn kind="primary" icon="plus" label="Create my first goal" style={{ alignSelf: 'flex-start' }} onPress={() => openGoalEditor()} />
        </View>
      ) : null}
      {goals.length ? goals.map(g => <GoalBlock key={g.id} g={g} />) : <GoalBlock g={DEMO} />}
      {!isPlus() ? <Cont k="night" v={1} photo="night" title={'Go deeper\nevery day.'} small="Selah Plus" onPress={() => router.push('/paywall')} /> : null}
    </TabScreen>
  );
}

function NotifBanner() {
  const S = useStore(); const c = useC(); const st = notifState();
  if ((!S.goals.length && !S.ur.watches.length) || st === 'granted' || st === 'unsupported') return null;
  if (st !== 'undetermined' && S.noticeHidden && Date.now() - S.noticeHidden < 7 * 864e5) return null;
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 16, borderRadius: 24, backgroundColor: c.surface, marginBottom: 22 }}>
      <Icon name="bell" color={c.ink} />
      <View style={{ flex: 1 }}>
        {st === 'undetermined' ? <>
          <Txt w={700} size={15}>Turn on reminders</Txt>
          <Txt size={15} style={{ marginTop: 2 }}>Selah can nudge you 30 minutes before your quiet time and again when it starts.</Txt>
          <Btn kind="primary" sm label="Allow notifications" style={{ alignSelf: 'flex-start', marginTop: 10 }} onPress={() => requestPerm()} />
        </> : <>
          <Txt w={700} size={15}>Notifications are blocked</Txt>
          <Txt size={15} style={{ marginTop: 2 }}>Reminders still show here while Selah is open. To get alerts on your phone, allow notifications for Selah in your phone’s settings.</Txt>
        </>}
      </View>
      {st !== 'undetermined' ? <Pressable accessibilityLabel={t('Hide for a week')} onPress={() => mutate(s => { s.noticeHidden = Date.now(); })} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}><Icon name="x" color={c.muted} /></Pressable> : null}
    </View>
  );
}

function WeeklyCard() {
  const S = useStore();
  const wk = dateKey(weekStart(0)); if (S.ur.seenWeek === wk) return null;
  const L = weekStats(-1); if (!L.secs && !L.goalsDone && !L.notes && !L.med && !L.rec.some(r => r.checks)) return null;
  return (
    <Cont k="grove" v={3} small="Your weekly update is ready" title={fmtLen(L.secs) + ' ' + t('in prayer last week')} tr={false}
      onPress={() => { mutate(s => { s.ur.seenWeek = wk; }); go('/insights', { o: '-1' }); }}>
      <Txt w={600} size={14} tr={false} style={{ marginTop: 4, opacity: 0.85 }}>{t(`${L.prayDays} day${L.prayDays === 1 ? '' : 's'} with God`) + (L.heard ? ', ' + t(`${L.heard} thing${L.heard === 1 ? '' : 's'} heard`) : '')}</Txt>
    </Cont>
  );
}

function Agenda() {
  const c = useC(); useStore();
  const its = agendaItems(); const nowHM = pad(new Date().getHours()) + ':' + pad(new Date().getMinutes());
  if (!its.length) return <Cont k="night" v={2} photo="night" small="Nothing scheduled today" title="Enter the upper room" onPress={() => go('/ur')} style={{ marginBottom: 28 }} />;
  const nextIdx = its.findIndex(x => !x.done && (!x.t || x.t >= nowHM));
  const open = (x: typeof its[0]) => {
    if (x.kind === 'goal') return; // the goal is on this page
    if (x.kind === 'watch') startPrayer('watch', x.id);
    else if (x.kind === 'free') go('/free', { id: x.id });
    else go('/day', { p: x.id, d: String(x.d) });
  };
  return (
    <View style={{ marginBottom: 28 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 12 }}>
        <Txt w={700} size={21} ls={-0.02}>Today’s schedule</Txt>
        <LinkBtn label="Upper room" onPress={() => go('/ur')} />
      </View>
      <View style={{ gap: 0 }}>
        {its.map((x, i) => {
          const next = i === nextIdx, last = i === its.length - 1;
          return (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'stretch', gap: 10 }}>
              <View style={{ width: 62, paddingTop: 16 }}><Txt w={600} size={13} muted tr={false} numberOfLines={2}>{x.t ? fmtTime(x.t) : t('Any time')}</Txt></View>
              <View style={{ width: 22, alignItems: 'center' }}>
                <View style={{ position: 'absolute', top: 0, bottom: last ? '60%' : 0, width: 2, backgroundColor: c.line }} />
                <View style={{ marginTop: 16, width: 20, height: 20, borderRadius: 10, backgroundColor: x.done ? '#23C25F' : next ? '#F4F01E' : c.surface2, borderWidth: next ? 0 : 2, borderColor: c.line, alignItems: 'center', justifyContent: 'center' }}>
                  {x.done ? <Icon name="check" size={13} color="#06341B" stroke={2.8} /> : null}
                </View>
              </View>
              <Pressable disabled={x.done || x.kind === 'goal'} onPress={() => { tap(); open(x); }} style={{ flex: 1, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 20, backgroundColor: next ? c.surface : x.done ? 'transparent' : c.surface, borderWidth: next ? 2 : 0, borderColor: '#F4F01E', opacity: x.done ? 0.6 : 1 }}>
                <View style={{ flex: 1 }}>
                  <Txt w={700} size={15.5} tr={false} style={x.done ? { textDecorationLine: 'line-through' } : undefined}>{x.title}</Txt>
                  <Txt muted size={13} tr={false}>{x.sub + (x.done ? ', ' + t('done') : '')}</Txt>
                </View>
                {!x.done && x.kind !== 'goal' ? <View style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: c.pill }}><Txt w={700} size={13} color={c.onPill}>{x.cta}</Txt></View> : null}
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
