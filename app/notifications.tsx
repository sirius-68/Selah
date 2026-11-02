import React, { useEffect, useReducer } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useStore, mutate } from '@/lib/store';
import { fmtClockTime, fmtDate, t } from '@/lib/i18n';
import { dateKey } from '@/lib/util';
import { chime } from '@/lib/sound';
import { clearInbox, inbox, Item, markAllRead, notifState, onAlerts, openFrom, openItem, prefs, Prefs, refreshPerm, removeItem, restoreInbox, requestPerm, setPref, testReminder, upcoming } from '@/lib/notify';
import { router } from 'expo-router';
import { Page, toast, toastUndo } from '@/ui/overlay';
import { Btn, LinkBtn, Switch, Txt, useC, tap } from '@/ui/kit';
import { Icon } from '@/ui/Icon';

const ICON: Record<string, [string, string, string]> = { goal: ['sun', '#F4F01E', '#17101F'], watch: ['moon', '#0D4A30', '#E8F27A'], free: ['shield', '#FFB0D4', '#4A0A14'], test: ['bell', '#B6AEFF', '#1E1446'] };
const dayLabel = (ms: number) => { const d = new Date(ms), k = dateKey(d), now = new Date(); if (k === dateKey(now)) return t('Today'); if (k === dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))) return t('Yesterday'); if (k === dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1))) return t('Tomorrow'); return fmtDate(d, { weekday: 'long', month: 'long', day: 'numeric' }); };

export default function Notifications() {
  const S = useStore(); const c = useC();
  const [, f] = useReducer(x => x + 1, 0);
  useEffect(() => { refreshPerm(); const off = onAlerts(f); return () => { off(); markAllRead(); }; }, []);
  const st = notifState(), list = inbox(), next = upcoming(4), P = prefs();
  const hasAny = S.goals.length || S.ur.watches.length || (S.rec.trackers || []).length;
  // group the inbox by day
  const groups: [string, Item[]][] = [];
  list.forEach(x => { const l = dayLabel(x.at), g = groups.find(y => y[0] === l); if (g) g[1].push(x); else groups.push([l, [x]]); });
  return (
    <Page title="Notifications">
      <PermCard st={st} />

      <Head title="Coming up" />
      {next.length ? <View style={{ gap: 8 }}>{next.map((e, i) => <Row key={i} kind={e.kind} title={e.title} body={dayLabel(e.at) + ', ' + fmtClockTime(new Date(e.at))} onPress={() => openFrom(e.kind, e.id)} />)}</View>
        : <View style={{ padding: 16, borderRadius: 22, backgroundColor: c.surface }}>
          <Txt size={15.5} lh={1.45}>{hasAny ? 'No reminders in the next 7 days. Check that reminders are switched on below.' : 'Nothing planned yet. Set a time for a quiet time and Selah will remind you.'}</Txt>
          {!hasAny ? <Btn sm kind="primary" icon="plus" label="Add a quiet time" style={{ alignSelf: 'flex-start', marginTop: 12 }} onPress={() => router.navigate('/(tabs)/goals' as any)} /> : null}
        </View>}

      <Head title="Earlier" right={list.length ? <LinkBtn label="Clear all" onPress={() => { const keep = inbox(); clearInbox(); toastUndo('Notifications cleared', () => restoreInbox(keep)); }} /> : null} />
      {!list.length ? <Txt muted size={15.5} lh={1.45}>You are all caught up. Reminders you receive are kept here for 30 days.</Txt> : null}
      {groups.map(([label, xs]) => (
        <View key={label} style={{ marginBottom: 12 }}>
          <Txt w={600} size={13.5} muted tr={false} style={{ marginBottom: 8 }}>{label}</Txt>
          <View style={{ gap: 8 }}>{xs.map(x => <Row key={x.key} kind={x.kind} title={x.title} body={x.body} time={fmtClockTime(new Date(x.at))} unread={!x.read} onPress={() => openItem(x)} onRemove={() => removeItem(x.key)} />)}</View>
        </View>
      ))}

      <Head title="Remind me about" />
      <View style={{ padding: 16, paddingBottom: 0, borderRadius: 24, backgroundColor: c.surface }}>
        <Toggle k="goal" P={P} title="Quiet times" sub="At the time you set on each goal" />
        <Toggle k="watch" P={P} title="Prayer watches" sub="From the Upper room" />
        <Toggle k="free" P={P} title="Break free" sub="Morning pledge and evening check-in" />
        <Toggle k="early" P={P} title="Early heads-up" sub="30 minutes before a quiet time, 10 before a watch" />
        <SwitchRow title="Reminder sound" sub="A soft chime when a reminder arrives" value={S.settings.sound} onChange={v => { mutate(x => { x.settings.sound = v; }); if (v) chime(); }} />
      </View>
      <Btn icon="bell" label="Send a test reminder" style={{ marginTop: 14 }} onPress={async () => { const sys = await testReminder(); toast(sys ? 'Test reminder sent. It arrives in 2 seconds.' : 'Test reminder added above'); f(); }} />
    </Page>
  );
}

function PermCard({ st }: { st: string }) {
  const c = useC();
  if (st === 'granted') return null;
  const blocked = st === 'denied', web = st === 'unsupported';
  return (
    <View style={{ flexDirection: 'row', gap: 12, padding: 16, borderRadius: 24, backgroundColor: blocked ? '#FFB0D4' : '#F4F01E', marginBottom: 6 }}>
      <Icon name="bell" color="#17101F" />
      <View style={{ flex: 1 }}>
        <Txt w={700} size={16} color="#17101F">{web ? 'Reminders show inside Selah' : blocked ? 'Notifications are blocked' : 'Turn on reminders'}</Txt>
        <Txt size={15} lh={1.4} color="#17101F" style={{ marginTop: 2 }}>{web ? 'This browser cannot show system notifications. Keep Selah open to see reminders, or install the app.' : blocked ? 'Reminders only show while Selah is open. Allow notifications for Selah in your phone settings to get them anytime.' : 'Get a gentle nudge on your phone when it is time to pray.'}</Txt>
        {!web ? <Pressable accessibilityRole="button" onPress={() => { tap(); if (blocked) Linking.openSettings().catch(() => {}); else requestPerm(); }} style={({ pressed }) => ({ alignSelf: 'flex-start', marginTop: 12, minHeight: 44, paddingHorizontal: 18, borderRadius: 999, backgroundColor: '#17101F', justifyContent: 'center', opacity: pressed ? 0.85 : 1 })}><Txt w={700} size={15} color="#fff">{blocked ? 'Open phone settings' : 'Allow notifications'}</Txt></Pressable> : null}
      </View>
    </View>
  );
}
function Head({ title, right }: { title: string; right?: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 22, paddingBottom: 12 }}><Txt w={700} size={20} ls={-0.02}>{title}</Txt>{right}</View>;
}
function Row({ kind, title, body, time, unread, onPress, onRemove }: { kind: string; title: string; body: string; time?: string; unread?: boolean; onPress: () => void; onRemove?: () => void }) {
  const c = useC(); const [ic, bg, fg] = ICON[kind] || ICON.test;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={(unread ? t('New') + ', ' : '') + title + ', ' + body} onPress={() => { tap(); onPress(); }}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 22, backgroundColor: c.surface, opacity: pressed ? 0.85 : 1 })}>
      <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}><Icon name={ic} size={20} color={fg} /></View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {unread ? <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: '#FF5A7A' }} /> : null}
          <Txt w={700} size={15.5} tr={false} style={{ flex: 1 }} numberOfLines={2}>{title}</Txt>
          {time ? <Txt muted size={13} tr={false}>{time}</Txt> : null}
        </View>
        <Txt muted size={14.5} lh={1.4} tr={false} numberOfLines={3} style={{ marginTop: 2 }}>{body}</Txt>
      </View>
      {onRemove ? <Pressable accessibilityRole="button" accessibilityLabel={t('Remove')} hitSlop={8} onPress={onRemove} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginRight: -4 }}><Icon name="x" size={18} color={c.muted} /></Pressable> : null}
    </Pressable>
  );
}
function SwitchRow({ title, sub, value, onChange }: { title: string; sub: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 }}>
      <View style={{ flex: 1 }}><Txt w={600} size={16}>{title}</Txt><Txt muted size={14} style={{ marginTop: 2 }}>{sub}</Txt></View>
      <Switch value={value} a11y={title} onChange={onChange} />
    </View>
  );
}
function Toggle({ k, P, title, sub }: { k: keyof Prefs; P: Prefs; title: string; sub: string }) {
  return <SwitchRow title={title} sub={sub} value={P[k]} onChange={v => setPref(k, v)} />;
}
