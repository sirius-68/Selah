/* Break free: tracker maths, daily verse and tasks, follow-up questions. */
import { S } from './store';
import { GEN_T, GEN_V, KINDS, MILES, TRIG_BASE, TRIG_KIND, VAFF } from './content';
import { parseRef } from './bible';
import { DAY, dateKey, dayNum, todayK } from './util';
import { t } from './i18n';

export const trk = (id: string | null | undefined) => S.rec.trackers.find((x: any) => x.id === id);
export const daysFree = (x: any) => Math.max(0, Math.floor((Date.now() - x.start) / DAY));
export const logsOf = (id: string) => (S.rec.logs[id] = S.rec.logs[id] || {});
export const urgesOf = (id: string) => (S.rec.urges[id] = S.rec.urges[id] || []);
export const dayIdx = (x: any) => Math.floor((Date.now() - x.created) / DAY);
export const kindOf = (x: any) => KINDS[x.kind] || KINDS.other;
export function frName(x: any) { return x.discreet ? t('Private tracker') : x.label; }
export function trMigrate(x: any) { if (!x) return x; if (!x.reasons) x.reasons = x.why ? [x.why] : []; x.triggers = x.triggers || []; x.plans = x.plans || []; if (!x.first) x.first = Math.min(x.created || x.start, x.start, ...(x.slips || [])); return x; }
export function verseFor(x: any) {
  const K = kindOf(x), list: string[] = []; const a = K.v, b = GEN_V;
  for (let i = 0; i < Math.max(a.length, b.length); i++) { if (a[i]) list.push(a[i]); if (b[i]) list.push(b[i]); }
  const ref = list[dayIdx(x) % list.length]; return { ref, a: VAFF[ref] || '', r: parseRef(ref) };
}
export function tasksFor(x: any) {
  const K = kindOf(x), d = dayIdx(x), out: string[] = [];
  if (K.t.length) out.push(K.t[d % K.t.length]);
  for (let i = 0; out.length < 3; i++) out.push(GEN_T[(d * 2 + i) % GEN_T.length]);
  return out;
}
export const nextMile = (n: number) => MILES.find(m => m > n) || null;
export function slipDays(x: any) { const s = new Set((x.slips || []).map((v: number) => dayNum(new Date(v)))); const L = logsOf(x.id); Object.keys(L).forEach(k => { if (L[k].clean === false && !L[k].partial) s.add(dayNum(new Date(k + 'T12:00'))); }); return s; }
export function freeWindow(x: any, N: number) { trMigrate(x); const today = dayNum(new Date()), first = dayNum(new Date(x.first)), from = Math.max(today - N + 1, first), sd = slipDays(x); let tot = 0, free = 0; for (let d = from; d <= today; d++) { tot++; if (!sd.has(d)) free++; } return { free, tot }; }
export function liveCount(x: any) { const ms = Math.max(0, Date.now() - x.start), d = Math.floor(ms / DAY), h = Math.floor(ms % DAY / 36e5), m = Math.floor(ms % 36e5 / 6e4); return { d, h, m }; }
export function trigList(x: any) { return [...new Set([...(x.triggers || []), ...TRIG_BASE, ...(TRIG_KIND[x.kind] || [])])]; }
export function planFor(x: any, trigs: string[]) { return (x.plans || []).find((p: any) => trigs.includes(p.when)) || null; }
const hasMood = (l: any, m: string) => !!l && ((l.moods || []).includes(m) || l.mood === m);
export function followUps(x: any): string[] {
  const L = logsOf(x.id), keys = Object.keys(L).filter(k => k < todayK() && !L[k].partial).sort(), last = keys.length ? L[keys[keys.length - 1]] : null;
  const n = daysFree(x), nm = nextMile(n), q: string[] = [];
  const ans = last && last.answers ? last.answers.map((a: any) => a.a).join(' ').toLowerCase() : '';
  if (last && last.clean === false) q.push('Your last check-in was a hard day. What was happening in the hour before the slip, and what could you do differently in that hour today?');
  if (/stress|work|boss|deadline|pressure/.test(ans)) q.push('You mentioned stress last time. What is one small way to lower the pressure today?');
  if (/alone|lonely|nobody|isolat/.test(ans) || hasMood(last, 'Lonely')) q.push('Who is one person you could reach out to today, even with a short message?');
  if (/tired|sleep|exhaust|night/.test(ans) || hasMood(last, 'Tired')) q.push('Tiredness makes cravings louder. How did you sleep, and what would help you rest tonight?');
  if (/angry|anger|fight|argument|mad/.test(ans) || hasMood(last, 'Angry')) q.push('Anger came up recently. What is underneath it, and how could you bring it to God instead of the habit?');
  if (last && last.tasks && Object.keys(last.tasks).length < 3) q.push('Not every task got done yesterday, and that’s okay. Which one felt hardest, and why?');
  if (nm && nm - n <= 2) q.push(nm - n === 1 ? `Tomorrow you reach ${nm} day${nm === 1 ? '' : 's'} free. How do you want to mark it?` : `You’re ${nm - n} days away from ${nm} days free. How do you want to mark it?`);
  q.push('When did you feel the strongest pull today, and where were you?');
  q.push('Where did you notice God’s help today, even in something small?');
  q.push('What are you proud of from today?');
  return [...new Set(q)].slice(0, 2);
}
export const todayLog = (x: any) => logsOf(x.id)[todayK()];
export const checkedIn = (x: any, k = todayK()) => { const l = logsOf(x.id)[k]; return !!(l && !l.partial); };
export const pledged = (x: any) => { const l = logsOf(x.id)[todayK()]; return !!(l && l.pledge); };
export { dateKey };
