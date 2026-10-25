/* Goals, daily affirmations, streaks, packs, Guide and Plus. */
import { S, mutate, Goal } from './store';
import { ALL, BYTHEME, ITEMS, Item, parseRef, passage, refLabel } from './bible';
import { DNAMES, MOODS, KW, PACK, PACKS, PEVERY, THEMES, TNOTE, FREE_GUIDE, CT, ThemeKey, TCOL } from './content';
import { dateKey, dayNum, hash, periodNum, todayK, DAY } from './util';
import { fmtDate, plural, t, VA } from './i18n';
import { timeTheme } from './theme';

export const DEMO: Goal = { id: '_', name: 'Word for today', theme: 'any', period: 'day', time: null, days: [0, 1, 2, 3, 4, 5, 6], on: false };
export const goalById = (id: string) => id === '_' ? DEMO : S.goals.find(g => g.id === id);
export function poolFor(g: Goal) { return g.theme === 'any' || !BYTHEME[g.theme] ? ALL : BYTHEME[g.theme]; }
export function affFor(g: Goal, d = new Date()): Item {
  const pool = poolFor(g), pn = periodNum(g.period, d), sk = g.id + ':' + pn;
  const idx = (pn + hash(g.id) + (S.shifts[sk] || 0)) % pool.length;
  return pool[((idx % pool.length) + pool.length) % pool.length];
}
export function themeFor(g: Goal): ThemeKey {
  if (S.settings.card !== 'auto' && (CT as any)[S.settings.card]) return S.settings.card as ThemeKey;
  const h = g.time ? parseInt(g.time, 10) : new Date().getHours(); return timeTheme(h);
}
export const cardKey = (): ThemeKey => (S.settings.card === 'auto' || !(CT as any)[S.settings.card]) ? timeTheme(new Date().getHours()) : S.settings.card as ThemeKey;
export function shareTextFor(aff: string | undefined, verse: string, ref: string) {
  return (aff ? aff + '\n\n' : '') + '“' + verse + '”\n' + t(ref) + ' (' + VA() + ')\n\n' + t('Shared from Selah');
}
export function affData(s: any) { const r = parseRef(String(s.ref).split(',')[0]); return { aff: s.a as string, text: (s.text as string) || (r ? passage(r) : ''), ref: s.ref as string, r }; }

export function streakOf(id: string) { const d = S.done[id] || {}; let n = 0; const c = new Date(); if (!d[dateKey(c)]) c.setDate(c.getDate() - 1); while (d[dateKey(c)]) { n++; c.setDate(c.getDate() - 1); } return n; }
export function nextOcc(g: { time: string | null; days: number[] }) {
  if (!g.time || !g.days.length) return null;
  const [h, m] = g.time.split(':').map(Number), now = new Date();
  for (let i = 0; i < 8; i++) { const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, h, m, 0); if (g.days.includes(d.getDay()) && d > now) return d; }
  return null;
}
export function dayWord(d: Date) { const a = dayNum(d) - dayNum(new Date()); return a === 0 ? t('Today') : a === 1 ? t('Tomorrow') : fmtDate(d, { weekday: 'short' }); }
export function countdown(d: Date) { const ms = +d - Date.now(), mins = Math.round(ms / 60000); if (mins < 1) return t('now'); if (mins < 60) return t('in ' + mins + 'm'); const h = Math.floor(mins / 60); if (h < 24) return t('in ' + h + 'h ' + (mins % 60) + 'm'); const days = Math.floor(h / 24); return t('in ' + days + (days === 1 ? ' day' : ' days')); }
export function daysLabel(ds: number[]) { if (ds.length === 7) return t('every day'); if (ds.length === 5 && [1, 2, 3, 4, 5].every(x => ds.includes(x))) return t('weekdays'); if (!ds.length) return t('no days'); return ds.slice().sort().map(x => fmtDate(new Date(2026, 1, 1 + x), { weekday: 'short' })).join(', '); }
export const pevery = (p: string) => t(PEVERY[p] || '');
export const dayInitials = () => DNAMES.map((_, i) => fmtDate(new Date(2026, 1, 1 + i), { weekday: 'narrow' }));
export const dayShort = (i: number) => fmtDate(new Date(2026, 1, 1 + i), { weekday: 'short' });

export function prayedToggle(gid: string) {
  const k = todayK(); let done = false;
  mutate(S => { S.done[gid] = S.done[gid] || {}; if (S.done[gid][k]) delete S.done[gid][k]; else { S.done[gid][k] = 1; done = true; } });
  return done;
}
export function toggleSaved(it: { id: string; a: string; ref: string }) {
  const ex = S.saved.some(s => s.id === it.id);
  mutate(S => { if (ex) S.saved = S.saved.filter(s => s.id !== it.id); else S.saved.push({ id: it.id, a: it.a, ref: it.ref, at: Date.now() }); });
  return !ex;
}

/* ---------- Plus, packs, Guide ---------- */
export const isPlus = () => !!S.plus;
export const ownsPack = (id: string) => isPlus() || !!S.packs.owned[id];
export const packDone = (id: string) => Object.keys(S.packs.prog[id] || {}).length;
export const dayOpen = (id: string, d: number) => d === 1 || ownsPack(id);
export const packTag = (id: string) => S.packs.owned[id] ? t('Owned') : isPlus() ? t('Included with Plus') : t('Day 1 free, then $' + PACK[id].price.toFixed(2));
export function guideLeft() { const n = S.guideUse[dateKey(new Date())] || 0; return isPlus() ? Infinity : Math.max(0, FREE_GUIDE - n); }
export function guideGenerate(mood: string, text: string) {
  const hits = KW.filter(([re]) => re.test(text || '')).map(([, th]) => th);
  const themes = hits.length ? hits : (MOODS[mood] ? MOODS[mood].th : THEMES);
  const recent = new Set(S.guide.slice(0, 12).map((g: any) => g.iid));
  let pool = ITEMS.filter(i => themes.includes(i.t) && !recent.has(i.id)); if (!pool.length) pool = ITEMS.filter(i => themes.includes(i.t));
  const it = pool[Math.floor(Math.random() * pool.length)];
  return { id: 'gd' + Date.now().toString(36), iid: it.id, mood: mood || '', theme: it.t, a: it.a, ref: refLabel(it.r), note: hits.includes(it.t) ? TNOTE[it.t] : (MOODS[mood] && MOODS[mood].th.includes(it.t) ? MOODS[mood].note : TNOTE[it.t]), at: Date.now() };
}
export const themeColor = (theme: string): ThemeKey => TCOL[theme] || 'dusk';
export { PACKS };

/* ---------- prayer calendar ---------- */
export function doneDays() { const s = new Set<string>(); Object.values(S.done).forEach(d => Object.keys(d).forEach(k => s.add(k))); return s; }
export const greet = () => { const hr = new Date().getHours(); return hr < 4 ? ['Still up?', 'Rest in Him.'] : hr < 12 ? ['Good morning,', 'start with Him.'] : hr < 18 ? ['Good afternoon,', 'take a pause.'] : ['Good evening,', 'be still.']; };
export const pluralT = (n: number, one: string, many?: string) => t(plural(n, one, many));
export const sinceDays = (ms: number) => Math.floor((Date.now() - ms) / DAY);
