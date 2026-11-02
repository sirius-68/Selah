/* Reminders as real system notifications: quiet times (30 min before and at
   the time), prayer watches (10 min before and at the time), and Break free
   pledge / check-in reminders. Rebuilt for the next 7 days after every change.

   Every reminder that comes due is also kept in an inbox on this device, so
   the Notifications screen can show what arrived, even when system
   notifications are blocked or the reminder was swiped away. */
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { S, onSave, kvGet, kvSet } from './store';
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
export function pushAlert(a: Alert) { ALERTS.unshift(a); ALERTS.splice(3); emit(); if (S.settings.sound) chime(); }

const native = Platform.OS !== 'web';
export type Perm = 'granted' | 'denied' | 'undetermined' | 'unsupported';
let perm: Perm = native ? 'undetermined' : 'unsupported';
export const notifState = () => perm;
export async function refreshPerm() { if (!native) return perm; try { const p = await Notifications.getPermissionsAsync(); perm = p.granted ? 'granted' : p.canAskAgain === false || p.status === 'denied' ? 'denied' : 'undetermined'; } catch (e) { } emit(); return perm; }
export async function requestPerm() {
  if (!native) return perm;
  try { const p = await Notifications.requestPermissionsAsync(); perm = p.granted ? 'granted' : 'denied'; } catch (e) { }
  emit(); reschedule(); return perm;
}
const systemOn = () => native && perm === 'granted';

/* ---------- what to remind about (device settings, on by default) ---------- */
export type Prefs = { goal: boolean; watch: boolean; free: boolean; early: boolean };
export const prefs = (): Prefs => Object.assign({ goal: true, watch: true, free: true, early: true }, kvGet<Partial<Prefs>>('selah.nprefs', {}));
export function setPref(k: keyof Prefs, v: boolean) { kvSet('selah.nprefs', { ...prefs(), [k]: v }); emit(); reschedule(); }

/* ---------- the plan for the next 7 days ---------- */
export type Ev = { at: number; title: string; body: string; kind: string; id: string };
export function events(): Ev[] {
  const out: Ev[] = [], now = new Date(), P = prefs();
  for (let i = 0; i < 7; i++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i), dow = day.getDay(), dk = dateKey(day);
    const at = (hm: string) => { const [h, m] = hm.split(':').map(Number); return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m); };
    if (P.goal) S.goals.forEach(g => {
      if (!g.on || !g.time || !g.days.includes(dow)) return;
      const when = at(g.time), it = affFor(g, when);
      if (P.early) out.push({ at: +when - 30 * 60000, title: t('Your quiet time starts in 30 minutes'), body: t(g.name) + '. ' + t('Today’s word:') + ' ' + t(it.a), kind: 'goal', id: g.id });
      out.push({ at: +when, title: t('It’s time:') + ' ' + t(g.name), body: t(it.a) + ' (' + t(refLabel(it.r)) + ')', kind: 'goal', id: g.id });
    });
    if (P.watch) S.ur.watches.forEach((w: any) => {
      if (!w.on || !w.days.includes(dow)) return;
      const when = at(w.time);
      if (P.early) out.push({ at: +when - 10 * 60000, title: t('Your prayer watch begins in 10 minutes'), body: w.name, kind: 'watch', id: w.id });
      out.push({ at: +when, title: t('It’s time to watch and pray'), body: w.name + ', ' + t(w.dur + ' minutes'), kind: 'watch', id: w.id });
    });
    if (P.free) (S.rec.trackers || []).forEach((x: any) => {
      const l = logsOf(x.id)[dk];
      if (x.remind && !(l && l.pledge)) out.push({ at: +at(x.remind), title: t('Time for today’s pledge'), body: t('Choose freedom today, one day at a time.'), kind: 'free', id: x.id });
      if (x.remind2 && !(l && !l.partial)) out.push({ at: +at(x.remind2), title: t('Time for your evening check-in'), body: (x.discreet ? '' : frName(x) + '. ') + t('Two questions and a short note.'), kind: 'free', id: x.id });
    });
  }
  return out.filter(e => e.at > Date.now() + 5000).sort((a, b) => a.at - b.at).slice(0, 60);
}
export const upcoming = (n = 4) => events().slice(0, n);

/* ---------- inbox ---------- */
export type Item = Ev & { key: string; read: boolean };
const IN = 'selah.inbox', PLAN = 'selah.notif';
const keyOf = (e: { kind: string; id: string; at: number }) => e.kind + ':' + e.id + ':' + Math.round(e.at / 60000);
export const inbox = (): Item[] => kvGet<Item[]>(IN, []);
export const unread = () => inbox().filter(x => !x.read).length;
function addInbox(list: Ev[], read = false) {
  if (!list.length) return;
  const cur = inbox(), have = new Set(cur.map(x => x.key)), cut = Date.now() - 30 * 864e5;
  const add = list.map(e => ({ ...e, key: keyOf(e), read })).filter(x => !have.has(x.key));
  if (!add.length) return;
  kvSet(IN, [...add, ...cur].filter(x => x.at > cut).sort((a, b) => b.at - a.at).slice(0, 80)); emit();
}
export function markAllRead() { const cur = inbox(); if (!cur.some(x => !x.read)) return; kvSet(IN, cur.map(x => ({ ...x, read: true }))); emit(); }
export function removeItem(key: string) { kvSet(IN, inbox().filter(x => x.key !== key)); emit(); }
export function clearInbox() { kvSet(IN, []); emit(); }
/* move everything in the saved plan that has come due into the inbox */
function collect() {
  const plan = kvGet<Ev[]>(PLAN, []), now = Date.now();
  const due = plan.filter(e => e.at <= now), rest = plan.filter(e => e.at > now);
  if (due.length) { kvSet(PLAN, rest); addInbox(due.filter(e => now - e.at < 3 * 864e5)); }
}

/* ---------- in-app timer: shows a reminder while Selah is open ---------- */
let tick: any = null;
function arm() {
  clearTimeout(tick); const nx = kvGet<Ev[]>(PLAN, [])[0]; if (!nx) return;
  const ms = nx.at - Date.now(); if (ms > 6 * 36e5) { tick = setTimeout(arm, 6 * 36e5); return; }
  tick = setTimeout(() => {
    const due = kvGet<Ev[]>(PLAN, []).filter(e => e.at <= Date.now() + 1000);
    collect();
    if (!systemOn()) due.forEach(e => pushAlert({ title: e.title, body: e.body, kind: e.kind, id: e.id }));
    arm();
  }, Math.max(1000, ms));
}

/* ---------- system scheduling ---------- */
let schedT: any = null, busy = false;
export function reschedule() { clearTimeout(schedT); schedT = setTimeout(doSchedule, 1200); }
async function doSchedule() {
  if (busy) { reschedule(); return; } busy = true;
  try {
    collect();
    const evs = events(); kvSet(PLAN, evs); arm();
    if (!native) return;
    await refreshPerm(); if (perm !== 'granted') return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const e of evs) {
      await Notifications.scheduleNotificationAsync({
        content: { title: e.title, body: e.body, data: { kind: e.kind, id: e.id, at: e.at }, sound: S.settings.sound ? 'default' : undefined },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(e.at), channelId: 'reminders' } as any,
      });
    }
  } catch (e) { } finally { busy = false; }
}
export async function testReminder() {
  const g = S.goals[0]; const it = g ? affFor(g) : null;
  const title = g ? t('It’s time:') + ' ' + t(g.name) : t('Word for today'), body = it ? t(it.a) + ' (' + t(refLabel(it.r)) + ')' : t('This is how your reminders will look.');
  const ev: Ev = { at: Date.now(), title, body, kind: g ? 'goal' : 'test', id: g ? g.id : '_' };
  if (systemOn()) {
    await Notifications.scheduleNotificationAsync({ content: { title, body, data: { kind: ev.kind, id: ev.id, at: ev.at + 2000 } }, trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 2, channelId: 'reminders' } as any });
    return true;
  }
  addInbox([ev]); pushAlert({ title, body, kind: ev.kind, id: ev.id }); return false;
}
export function openFrom(kind: string, id: string) {
  if (kind === 'watch') router.push({ pathname: '/ur/run', params: { k: 'watch', id } });
  else if (kind === 'free') router.push({ pathname: '/free', params: { id } });
  else if (kind === 'goal') router.navigate({ pathname: '/(tabs)', params: { g: id } } as any);
  else router.navigate('/(tabs)' as any);
}
export const openAlert = (a: Alert) => openFrom(a.kind, a.id);
export function openItem(x: Item) { kvSet(IN, inbox().map(y => y.key === x.key ? { ...y, read: true } : y)); emit(); openFrom(x.kind, x.id); }

export function bootReminders() {
  if (native) {
    Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: false, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false, shouldShowAlert: false } as any) });
    if (Platform.OS === 'android') Notifications.setNotificationChannelAsync('reminders', { name: 'Reminders', importance: Notifications.AndroidImportance.HIGH, sound: 'default', vibrationPattern: [0, 200, 120, 200] }).catch(() => {});
    const fromN = (n: Notifications.Notification): Ev => { const c = n.request.content, d: any = c.data || {}; return { at: d.at || n.date || Date.now(), title: c.title || '', body: c.body || '', kind: d.kind || 'goal', id: d.id || '' }; };
    Notifications.addNotificationReceivedListener(n => { const e = fromN(n); addInbox([e]); pushAlert(e); });
    Notifications.addNotificationResponseReceivedListener(r => { const e = fromN(r.notification); addInbox([e], true); setTimeout(() => openFrom(e.kind, e.id), 300); });
    Notifications.getLastNotificationResponseAsync().then(r => { if (r) { const e = fromN(r.notification); addInbox([e], true); setTimeout(() => openFrom(e.kind, e.id), 1200); } }).catch(() => {});
  }
  collect(); reschedule();
  onSave(reschedule);
  AppState.addEventListener('change', st => { if (st === 'active') { refreshPerm(); collect(); arm(); } });
}
