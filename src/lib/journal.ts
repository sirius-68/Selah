/* My journal: notebooks, notes, check-in notes. */
import { S, save } from './store';
import { NC, PACK } from './content';
import { dateKey, dayNum, hash } from './util';
import { fmtClockTime, fmtDate, t } from './i18n';

export const liveNotes = () => S.jn.notes.filter((n: any) => !n.trash);
export const jnote = (id: string) => S.jn.notes.find((n: any) => n.id === id);
export const jbook = (id: string) => S.jn.books.find((b: any) => b.id === id) || S.jn.books[0];
export const nWords = (n: any) => ((n.title || '') + ' ' + (n.body || '') + ' ' + (n.items || []).map((i: any) => i.t).join(' ')).trim().split(/\s+/).filter(Boolean).length;
export const isEmptyNote = (n: any) => !(n.title || '').trim() && !(n.body || '').trim() && !(n.items || []).some((i: any) => i.t.trim()) && !n.verse;
export const tilt = (id: string) => ((hash(id) % 11) - 5) * 1.1;
export const ncol = (c: string) => (NC[c] || NC.butter).c;
export function jStreak() { const days = new Set(liveNotes().map((n: any) => dateKey(new Date(n.created)))); let c = 0; const d = new Date(); if (!days.has(dateKey(d))) d.setDate(d.getDate() - 1); while (days.has(dateKey(d))) { c++; d.setDate(d.getDate() - 1); } return c; }
export function fmtWhen(ms: number) {
  const d = new Date(ms), tt = new Date(); const a = dayNum(tt) - dayNum(d); const tm = fmtClockTime(d);
  return a === 0 ? t('Today') + ', ' + tm : a === 1 ? t('Yesterday') + ', ' + tm : fmtDate(d, { month: 'short', day: 'numeric', year: d.getFullYear() === tt.getFullYear() ? undefined : 'numeric' });
}
export function newNote(extra?: any) {
  const n: any = Object.assign({ id: 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), book: S.jn.books[0].id, title: '', body: '', c: 'butter', pin: false, mood: '', tags: [], verse: '', items: [], created: Date.now(), updated: Date.now(), trash: null }, extra || {});
  if (!extra || !extra.c) n.c = (jbook(n.book) || {}).c || 'butter';
  S.jn.notes.unshift(n); save(); return n;
}
export function checkinNotes() {
  const out: any[] = [];
  (S.rec.trackers || []).forEach((x: any) => { const L = (S.rec.logs || {})[x.id] || {}; Object.keys(L).forEach(k => { const l = L[k]; if (l && !l.partial && (l.journal || '').trim()) out.push({ kind: 'free', t: x, k, l, at: l.at || new Date(k + 'T12:00').getTime() }); }); });
  Object.entries(S.journal || {}).forEach(([k, j]: [string, any]) => { const [pid, dn] = k.split(':'), p = PACK[pid]; if (p && j && j.t) out.push({ kind: 'pack', p, dn: +dn, k, j, at: j.at }); });
  return out.sort((a, b) => b.at - a.at);
}
export function urBook() { let b = S.jn.books.find((x: any) => x.ur); if (!b) { b = { id: 'bur', name: 'Upper room', icon: 'moon', c: 'lilac', at: Date.now(), ur: true }; S.jn.books.push(b); } return b; }
