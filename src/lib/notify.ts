/* Reminders as real system notifications: quiet times (30 min before and at
   the time), prayer watches (10 min before and at the time), and Break free
   pledge / check-in reminders. Rebuilt for the next 7 days after every change. */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { S, onSave } from './store';
import { affFor } from './affirm';
import { refLabel } from './bible';
import { logsOf, frName } from './free';
import { dateKey } from './util';
import { t } from './i18n';
import { chime } from './sound';

export type Alert = { title: string; body: string; kind: string; id: string };
export const ALERTS: Alert[] = [];
const subs = new Set<() => void>();
export const onAlerts = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
const emit = () => subs.forEach(f => f());
export function dismissAlert(i: number) { ALERTS.splice(i, 1); emit(); }
export function pushAlert(a: Alert) { ALERTS.unshift(a); ALERTS.splice(3); emit(); chime(); }

const native = Platform.OS !== 'web';
export type Perm = 'granted' | 'denied' | 'undetermined' | 'unsupported';
let perm: Perm = native ? 'undetermined' : 'unsupported';
export const notifState = () => perm;
export async function refreshPerm() { if (!native) return perm; try { const p = await Notifications.getPermissionsAsync(); perm = p.granted ? 'granted' : p.canAskAgain === false || p.status === 'denied' ? 'denied' : 'undetermined'; } catch (e) { } emit(); return perm; }
export async function requestPerm() {
  if (!native) return perm;
  try { const p = await Notifications.requestPermissionsAsync(); perm = p.granted ? 'granted' : 'denied'; } catch (e) { }
  emit(); if (perm === 'granted') reschedule(); return perm;
}

type Ev = { at: Date; title: string; body: string; kind: string; id: string };
function events(): Ev[] {
  const out: Ev[] = [], now = new Date();
  for (let i = 0; i < 7; i++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i), dow = day.getDay(), dk = dateKey(day);
    S.goals.forEach(g => {
      if (!g.on || !g.time || !g.days.includes(dow)) return;
      const [h, m] = g.time.split(':').map(Number), at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m), it = affFor(g, at);
      out.push({ at: new Date(+at - 30 * 60000), title: t('Your quiet time starts in 30 minutes'), body: t(g.name) + '. ' + t('Today’s word:') + ' ' + t(it.a), kind: 'goal', id: g.id });
      out.push({ at, title: t('It’s time:') + ' ' + t(g.name), body: t(it.a) + ' (' + t(refLabel(it.r)) + ')', kind: 'goal', id: g.id });
    });
    S.ur.watches.forEach((w: any) => {
      if (!w.on || !w.days.includes(dow)) return;
      const [h, m] = w.time.split(':').map(Number), at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m);
      out.push({ at: new Date(+at - 10 * 60000), title: t('Your prayer watch begins in 10 minutes'), body: w.name, kind: 'watch', id: w.id });
      out.push({ at, title: t('It’s time to watch and pray'), body: w.name + ', ' + t(w.dur + ' minutes'), kind: 'watch', id: w.id });
    });
    (S.rec.trackers || []).forEach((x: any) => {
      const l = logsOf(x.id)[dk];
      const at = (hm: string) => { const [h, m] = hm.split(':').map(Number); return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m); };
      if (x.remind && !(l && l.pledge)) out.push({ at: at(x.remind), title: t('Time for today’s pledge'), body: t('Choose freedom today, one day at a time.'), kind: 'free', id: x.id });
      if (x.remind2 && !(l && !l.partial)) out.push({ at: at(x.remind2), title: t('Time for your evening check-in'), body: (x.discreet ? '' : frName(x) + '. ') + t('Two questions and a short note.'), kind: 'free', id: x.id });
    });
  }
  return out.filter(e => +e.at > Date.now() + 5000).sort((a, b) => +a.at - +b.at).slice(0, 60);
}
let schedT: any = null, busy = false;
export function reschedule() { if (!native) return; clearTimeout(schedT); schedT = setTimeout(doSchedule, 1500); }
async function doSchedule() {
  if (busy) { reschedule(); return; } busy = true;
  try {
    await refreshPerm(); if (perm !== 'granted') return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const e of events()) {
      await Notifications.scheduleNotificationAsync({
        content: { title: e.title, body: e.body, data: { kind: e.kind, id: e.id }, sound: S.settings.sound ? 'default' : undefined },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: e.at, channelId: 'reminders' } as any,
      });
    }
  } catch (e) { } finally { busy = false; }
}
export async function testReminder() {
  const g = S.goals[0]; const it = g ? affFor(g) : null;
  const title = g ? t('It’s time:') + ' ' + t(g.name) : t('Word for today'), body = it ? t(it.a) + ' (' + t(refLabel(it.r)) + ')' : t('This is how your reminders will look.');
  if (native && perm === 'granted') { await Notifications.scheduleNotificationAsync({ content: { title, body, data: { kind: 'goal', id: g ? g.id : '_' } }, trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 2, channelId: 'reminders' } as any }); return true; }
  pushAlert({ title, body, kind: 'goal', id: '_' }); return false;
}
function openFrom(kind: string, id: string) {
  if (kind === 'watch') router.push({ pathname: '/ur/run', params: { k: 'watch', id } });
  else if (kind === 'free') router.push({ pathname: '/free', params: { id } });
  else router.navigate('/(tabs)' as any);
}
export const openAlert = (a: Alert) => openFrom(a.kind, a.id);

export function bootReminders() {
  if (!native) return;
  Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: false, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false, shouldShowAlert: false } as any) });
  if (Platform.OS === 'android') Notifications.setNotificationChannelAsync('reminders', { name: 'Reminders', importance: Notifications.AndroidImportance.HIGH, sound: 'default', vibrationPattern: [0, 200, 120, 200] }).catch(() => {});
  Notifications.addNotificationReceivedListener(n => { const c = n.request.content; const d: any = c.data || {}; pushAlert({ title: c.title || '', body: c.body || '', kind: d.kind || 'goal', id: d.id || '' }); });
  Notifications.addNotificationResponseReceivedListener(r => { const d: any = r.notification.request.content.data || {}; setTimeout(() => openFrom(d.kind, d.id), 300); });
  Notifications.getLastNotificationResponseAsync().then(r => { if (r) { const d: any = r.notification.request.content.data || {}; setTimeout(() => openFrom(d.kind, d.id), 1200); } }).catch(() => {});
  refreshPerm().then(reschedule);
  onSave(reschedule);
}
