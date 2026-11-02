/* Upper room: prayer sessions and watches, agenda, weekly insights. */
import { S } from './store';
import { PACK, PACKS, SCP, URV } from './content';
import { DAY, dateKey, inWeek, todayK, weekStart } from './util';
import { daysFree } from './free';
import { nWords } from './journal';
import { dayOpen } from './affirm';
import { t } from './i18n';
import { myTracks } from './tracks';

export function urVerses(x: any): string[] { if (x.verses) return x.verses; if (x.gen) return [...new Set([...(x.custom || []), ...x.gen])]; return [...new Set([...(x.themes || []).flatMap((th: string) => URV[th] || []), ...(x.custom || [])])]; }
export const urItem = (kind: string, id: string) => (kind === 'watch' ? S.ur.watches : S.ur.sessions).find((x: any) => x.id === id);
export function plName(it: any) { if (it.t === 'scape') return t((SCP[it.id] || { n: 'Sound' }).n); const m = myTracks().find(x => x.id === it.id); return m ? m.name : t('Missing sound'); }
export function nextWatch() {
  let best: { w: any; d: Date } | null = null;
  S.ur.watches.filter((w: any) => w.on && w.days.length).forEach((w: any) => { const [h, m] = w.time.split(':').map(Number), now = new Date(); for (let i = 0; i < 8; i++) { const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, h, m); if (w.days.includes(d.getDay()) && d > now) { if (!best || d < best.d) best = { w, d }; break; } } });
  return best as { w: any; d: Date } | null;
}
export function prayStreak() {
  const days = new Set(S.ur.logs.map((l: any) => dateKey(new Date(l.start)))); Object.values(S.done).forEach(o => Object.keys(o).forEach(k => days.add(k)));
  let n = 0; const d = new Date(); if (!days.has(dateKey(d))) d.setDate(d.getDate() - 1); while (days.has(dateKey(d))) { n++; d.setDate(d.getDate() - 1); } return n;
}
export function weekStats(off: number) {
  const a = +weekStart(off), days = [0, 1, 2, 3, 4, 5, 6].map(i => a + i * DAY);
  const logs = S.ur.logs.filter((l: any) => inWeek(l.start, off)), secs = logs.reduce((s: number, l: any) => s + l.secs, 0);
  const perDay = days.map(d => logs.filter((l: any) => l.start >= d && l.start < d + DAY).reduce((s: number, l: any) => s + l.secs, 0));
  const dk = days.map(d => dateKey(new Date(d)));
  const goalDays = new Set<string>(); Object.values(S.done).forEach(o => Object.keys(o).forEach(k => { if (dk.includes(k)) goalDays.add(k); }));
  const prayDays = new Set([...goalDays, ...dk.filter((k, i) => perDay[i] > 0)]);
  const med = dk.reduce((s, k) => s + (S.med[k] || 0), 0);
  const notes = S.jn.notes.filter((n: any) => !n.trash && inWeek(n.created, off));
  const heard = logs.filter((l: any) => l.heard).length;
  const guide = S.guide.filter((g: any) => inWeek(g.at, off)).length;
  const goalsDone = Object.values(S.done).reduce((s, o) => s + Object.keys(o).filter(k => dk.includes(k)).length, 0);
  const rec = (S.rec.trackers || []).map((x: any) => { const L = (S.rec.logs || {})[x.id] || {}; const ls = dk.map(k => L[k]).filter((l: any) => l && !l.partial); return { t: x, checks: ls.length, avg: ls.length ? Math.round(ls.reduce((s: number, l: any) => s + (l.crave || 0), 0) / ls.length * 10) / 10 : null, slips: ls.filter((l: any) => !l.clean).length, free: daysFree(x) }; });
  return { a, secs, count: logs.length, watches: logs.filter((l: any) => l.kind === 'watch').length, longest: logs.reduce((m: number, l: any) => Math.max(m, l.secs), 0), perDay, prayDays: prayDays.size, med, notes: notes.length, words: notes.reduce((s: number, n: any) => s + nWords(n), 0), heard, guide, goalsDone, rec };
}
export type AgendaItem = { t: string | null; title: string; sub: string; done: boolean; kind: 'goal' | 'watch' | 'free' | 'pack'; id: string; d?: number; cta: string };
export function agendaItems(): AgendaItem[] {
  const now = new Date(), dow = now.getDay(), tk = todayK(), items: AgendaItem[] = [];
  S.goals.filter(g => g.time && g.days.includes(dow)).forEach(g => items.push({ t: g.time, title: g.name, sub: t('Quiet time, ' + (g.theme === 'any' ? 'mixed' : g.theme.toLowerCase())), done: !!(S.done[g.id] && S.done[g.id][tk]), kind: 'goal', id: g.id, cta: 'View' }));
  S.ur.watches.filter((w: any) => w.on && w.days.includes(dow)).forEach((w: any) => { const done = S.ur.logs.some((l: any) => l.kind === 'watch' && l.refId === w.id && dateKey(new Date(l.start)) === tk); items.push({ t: w.time, title: w.name, sub: t(`Prayer watch, ${w.dur} min`), done, kind: 'watch', id: w.id, cta: 'Start' }); });
  (S.rec.trackers || []).forEach((x: any) => { const l = ((S.rec.logs || {})[x.id] || {})[tk]; items.push({ t: null, title: S.rec.trackers.length > 1 ? t('Break free check-in') + ', ' + (x.discreet ? t('Private tracker') : x.label) : t('Break free check-in'), sub: t('2 questions and a short note'), done: !!(l && !l.partial), kind: 'free', id: x.id, cta: 'Check in' }); });
  PACKS.forEach(p => { const pr = S.packs.prog[p.id] || {}, n = Object.keys(pr).length; if (!n || n >= 7) return; const next = [1, 2, 3, 4, 5, 6, 7].find(d => !pr[d]); if (next && dayOpen(p.id, next)) items.push({ t: null, title: t(PACK[p.id].title) + ', ' + t('day ' + next).replace(/^./, c => c.toLowerCase()), sub: t('Affirmation pack'), done: false, kind: 'pack', id: p.id, d: next, cta: 'Open' }); });
  return items.sort((a, b) => (a.t ? 0 : 1) - (b.t ? 0 : 1) || (a.t || '').localeCompare(b.t || ''));
}
export function fmtLen(s: number) { s = Math.round(s); if (!s) return t('0 min'); if (s < 60) return t(s + ' sec'); const m = Math.round(s / 60); if (m < 60) return t(m + ' min'); return t(Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + (m % 60) + ' min' : '')); }
