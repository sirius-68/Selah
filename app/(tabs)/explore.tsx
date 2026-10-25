import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useStore } from '@/lib/store';
import { KINDS, PACK, PACKS, PH_PACK, PH_SCAPE, ThemeKey } from '@/lib/content';
import { dayOpen, dayWord, isPlus, packDone, packTag } from '@/lib/affirm';
import { nextWatch } from '@/lib/ur';
import { checkedIn, daysFree, frName, pledged } from '@/lib/free';
import { fmtTime, plural, t } from '@/lib/i18n';
import { scapeInfo } from '@/lib/sound';
import { TabScreen } from '@/ui/TabScreen';
import { LinkBtn, Title, Txt, useC, Lead, tap } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { go } from '@/ui/overlay';
import { Cont, PackCard, XRow } from '@/features/blocks';
import { XIllo } from '@/features/XIllo';
import { startPrayer } from '@/features/urEngine';
import { CT } from '@/lib/content';
import { useTick } from '@/lib/hooks';

type XC = { type: 'pledge' | 'check' | 'watch' | 'pack'; k: ThemeKey; small: string; title: string; icon: string; fill?: boolean; pid?: string; onPress: () => void };
function cards(S: any): XC[] {
  const out: XC[] = [], hr = new Date().getHours();
  (S.rec.trackers || []).forEach((x: any) => {
    if (!pledged(x) && hr < 14) out.push({ type: 'pledge', k: 'dawn', small: frName(x), title: t('Make today’s pledge'), icon: 'arrow', onPress: () => go('/free', { id: x.id }) });
    else if (!checkedIn(x) && hr >= 14) out.push({ type: 'check', k: 'ember', small: frName(x), title: t('Check in for today'), icon: 'arrow', onPress: () => go('/free/check', { id: x.id }) });
  });
  const nw = nextWatch(); if (nw && +nw.d - Date.now() < 20 * 36e5) out.push({ type: 'watch', k: 'night', small: dayWord(nw.d) + ', ' + fmtTime(nw.w.time), title: nw.w.name, icon: 'play', fill: true, onPress: () => startPrayer('watch', nw.w.id) });
  PACKS.forEach(p => { const pr = S.packs.prog[p.id] || {}, n = Object.keys(pr).length; if (!n || n >= 7) return; const next = [1, 2, 3, 4, 5, 6, 7].find(d => !pr[d]); if (next && dayOpen(p.id, next)) out.push({ type: 'pack', k: p.k, pid: p.id, small: t('Day ' + next), title: t(PACK[p.id].title), icon: 'arrow', onPress: () => go('/day', { p: p.id, d: String(next) }) }); });
  return out.slice(0, 4);
}
function XCard({ x }: { x: XC }) {
  const T = CT[x.k];
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={x.small + ', ' + x.title} onPress={() => { tap(); x.onPress(); }} style={({ pressed }) => ({ width: 200, minHeight: 184, borderRadius: 26, overflow: 'hidden', backgroundColor: T.bg, padding: 16, paddingTop: 112, justifyContent: 'flex-end', transform: [{ scale: pressed ? 0.98 : 1 }] })}>
      <XIllo type={x.type} k={x.k} pid={x.pid} />
      <View style={{ position: 'absolute', top: 12, right: 12, width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><Icon name={x.icon} size={16} color="#17101F" fill={x.fill} /></View>
      <Txt w={600} size={13} color={T.t} tr={false} style={{ opacity: 0.8 }}>{x.small}</Txt>
      <Txt w={700} size={19} lh={1.15} ls={-0.02} color={T.t} tr={false} style={{ marginTop: 4 }}>{x.title}</Txt>
    </Pressable>
  );
}

export default function Explore() {
  const S = useStore(); useTick(60000);
  const cont = cards(S), nw = nextWatch(), nNotes = S.jn.notes.filter((n: any) => !n.trash).length, ses = S.ur.sessions.length, wat = S.ur.watches.length;
  const cur = scapeInfo(S.scape.id);
  return (
    <TabScreen>
      <View style={{ paddingTop: 14, paddingBottom: 6 }}>
        <Title a="Let’s go" b="deeper." />
        <Lead style={{ marginTop: 8, marginBottom: 0 }}>Pray, reflect and grow, one step at a time.</Lead>
      </View>
      {cont.length ? (
        <View style={{ marginTop: 26 }}>
          <Txt w={700} size={21} ls={-0.02} style={{ marginBottom: 12 }}>Pick up where you left off</Txt>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 4 }}>
            {cont.map((x, i) => <XCard key={i} x={x} />)}
          </ScrollView>
        </View>) : null}
      <View style={{ marginTop: 26 }}>
        <Txt w={700} size={21} ls={-0.02} style={{ marginBottom: 12 }}>Your spaces</Txt>
        <View style={{ gap: 8 }}>
          <XRow k="night" icon="moon" title="Upper room" onPress={() => go('/ur')} status={nw ? t('Next watch') + ' ' + dayWord(nw.d) + ', ' + fmtTime(nw.w.time) : ses + wat ? t(plural(ses, 'session')) + ', ' + t(plural(wat, 'watch', 'watches')) : t('Prayer sessions and watches')} />
          <XRow k="day" icon="journal" title="My journal" onPress={() => go('/journal')} status={nNotes ? t(plural(nNotes, 'entry', 'entries')) : t('Notebooks, notes and a sticky board')} />
          {S.rec.trackers.length ? S.rec.trackers.map((x: any) => { const n = daysFree(x), K = KINDS[x.kind] || KINDS.other; return (
            <XRow key={x.id} k={K.k} icon="shield" title="Break free" onPress={() => go('/free', { id: x.id })} status={frName(x) + ', ' + t(plural(n, 'day') + ' free')} pill={checkedIn(x) ? undefined : 'Check in'} />); })
            : <XRow k="ember" icon="shield" title="Break free" onPress={() => go('/free')} status={t('Leave a habit behind, one day at a time.')} />}
        </View>
      </View>
      <View style={{ marginTop: 26 }}>
        <Txt w={700} size={21} ls={-0.02} style={{ marginBottom: 12 }}>Grow</Txt>
        <XRow k="dusk" icon="spark" title="Ask the Guide" onPress={() => go('/guide')} status={t('Affirmations for how you feel right now')} pill={isPlus() ? undefined : '1 free a day'} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 20, paddingBottom: 12 }}>
          <Txt w={700} size={17}>Affirmation packs</Txt>
          <LinkBtn label="See all" onPress={() => go('/packs')} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 10 }}>
          {PACKS.map(p => <PackCard key={p.id} p={p} tag={packTag(p.id)} done={packDone(p.id)} photo={PH_PACK[p.id]} onPress={() => go('/pack', { id: p.id })} />)}
        </ScrollView>
      </View>
      <View style={{ marginTop: 26 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 12 }}>
          <Txt w={700} size={21} ls={-0.02}>Rest</Txt>
          <LinkBtn label="All sounds" onPress={() => go('/audio')} />
        </View>
        <Cont k={cur.k} v={3} photo={PH_SCAPE[cur.id] || 'night'} small="Tonight’s Sleep Scape" title={cur.n} tr={!cur.user} go="play" goFill onPress={() => go('/audio')} />
      </View>
      <View style={{ marginTop: 6 }}>
        <Txt w={700} size={21} ls={-0.02} style={{ marginBottom: 12 }}>Make it yours</Txt>
        <XRow k="day" icon="phone" title="Widgets" onPress={() => go('/widgets')} status={t('Design your home and lock screen')} pill={isPlus() ? undefined : 'Plus'} />
      </View>
    </TabScreen>
  );
}
