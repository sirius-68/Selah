/* App state. Same shape and storage key as the web app ("selah.v1"), so the
   cloud row in Supabase is shared by the website, Android and iOS. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { DAY } from './util';

export type Goal = { id: string; name: string; theme: string; period: string; time: string | null; days: number[]; on: boolean };
export type State = Record<string, any> & {
  goals: Goal[]; saved: any[]; hl: Record<string, number>; notes: Record<string, any>; marks: string[];
  done: Record<string, Record<string, number>>; shifts: Record<string, number>; fired: Record<string, number>;
  settings: { theme: string; font: number; card: string; sound: boolean; read: string; lang: string; ver: string; verPicked?: boolean };
  pos: { b: number; c: number } | null; intro: number; user: any; guest: number; plus: any;
  guide: any[]; journal: Record<string, any>; packs: { owned: Record<string, any>; prog: Record<string, Record<string, number>> };
  guideUse: Record<string, number>; scape: { voice: boolean; timer: number; vol: number; id: string }; widget: any;
  rec: { trackers: any[]; logs: Record<string, Record<string, any>>; urges: Record<string, any[]> };
  jn: { books: any[]; notes: any[] }; ur: { sessions: any[]; watches: any[]; logs: any[]; fired: Record<string, number>; repeat: string; seenWeek?: string };
  med: Record<string, number>; lock: { on: boolean; len: number; after: number; hash: string; salt: string; algo: string; bio: string | boolean; fails: number; until: number };
};

export const KEY = 'selah.v1';
const defJournal = () => { const t = Date.now(); return { books: [{ id: 'b1', name: 'Daily journal', icon: 'sun', c: 'butter', at: t }, { id: 'b2', name: 'Prayers', icon: 'heart', c: 'rose', at: t + 1 }, { id: 'b3', name: 'Gratitude', icon: 'spark', c: 'mint', at: t + 2 }, { id: 'b4', name: 'Sermon notes', icon: 'book', c: 'sky', at: t + 3 }], notes: [] as any[] }; };
export const DEF = (): State => ({
  goals: [], saved: [], hl: {}, notes: {}, marks: [], done: {}, shifts: {}, fired: {},
  settings: { theme: 'dark', font: 19, card: 'auto', sound: true, read: 'sans', lang: 'en', ver: 'kjv' },
  pos: null, intro: 0, user: null, guest: 0, plus: null,
  guide: [], journal: {}, packs: { owned: {}, prog: {} }, guideUse: {}, scape: { voice: true, timer: 30, vol: 0.8, id: 'rain' }, widget: null,
  rec: { trackers: [], logs: {}, urges: {} }, jn: defJournal(),
  ur: { sessions: [], watches: [], logs: [], fired: {}, repeat: 'all' }, med: {},
  lock: { on: false, len: 4, after: 0, hash: '', salt: '', algo: '', bio: '', fails: 0, until: 0 },
});

/* fill in anything an older or partial state is missing (also used after a cloud pull) */
export function normalize(o: any): State {
  const d = DEF(), s: any = Object.assign(d, o || {});
  s.settings = Object.assign(DEF().settings, (o && o.settings) || {});
  if (!Array.isArray(s.guide)) s.guide = [];
  if (!s.journal || Array.isArray(s.journal)) s.journal = {};
  s.packs = Object.assign({ owned: {}, prog: {} }, s.packs || {}); s.packs.owned = s.packs.owned || {}; s.packs.prog = s.packs.prog || {};
  s.guideUse = s.guideUse || {};
  s.scape = Object.assign({ voice: true, timer: 30, vol: 0.8, id: 'rain' }, s.scape || {});
  s.rec = s.rec || {}; s.rec.trackers = s.rec.trackers || []; s.rec.logs = s.rec.logs || {}; s.rec.urges = s.rec.urges || {};
  if (!s.jn || !Array.isArray(s.jn.books)) s.jn = defJournal(); s.jn.notes = s.jn.notes || [];
  const cut = Date.now() - 30 * DAY; s.jn.notes = s.jn.notes.filter((n: any) => !n.trash || n.trash > cut);
  s.ur = Object.assign({ sessions: [], watches: [], logs: [], fired: {}, repeat: 'all' }, s.ur || {});
  s.med = s.med || {};
  s.lock = Object.assign({ on: false, len: 4, after: 0, hash: '', salt: '', algo: '', bio: '', fails: 0, until: 0 }, s.lock || {});
  ['goals', 'saved', 'marks'].forEach(k => { if (!Array.isArray(s[k])) s[k] = []; });
  ['hl', 'notes', 'done', 'shifts', 'fired'].forEach(k => { if (!s[k] || typeof s[k] !== 'object') s[k] = {}; });
  return s;
}

export let S: State = DEF();
let ver = 0, ready = false, saveT: any = null;
const subs = new Set<() => void>();
const hooks: (() => void)[] = [];

export async function loadState() {
  try { const r = await AsyncStorage.getItem(KEY); S = normalize(r ? JSON.parse(r) : null); } catch (e) { S = DEF(); }
  ready = true; emit();
}
export const isReady = () => ready;
function emit() { ver++; subs.forEach(f => f()); }
function persist() { clearTimeout(saveT); saveT = setTimeout(() => { AsyncStorage.setItem(KEY, JSON.stringify(S)).catch(() => {}); }, 150); }
export function flush() { clearTimeout(saveT); return AsyncStorage.setItem(KEY, JSON.stringify(S)).catch(() => {}); }

/* save(): persist, redraw and (through hooks) queue a cloud sync */
export function save(opts?: { quiet?: boolean }) { persist(); emit(); if (!opts || !opts.quiet) hooks.forEach(h => h()); }
/* change state in place, then save */
export function mutate(fn: (s: State) => void, opts?: { quiet?: boolean }) { fn(S); save(opts); }
export function replaceState(next: State) { S = next; persist(); emit(); }
export function onSave(fn: () => void) { hooks.push(fn); }
/* redraw without saving (for things that change with time) */
export function poke() { emit(); }

const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
const snap = () => ver;
/* re-render the calling component on any state change; returns the state */
export function useStore(): State { useSyncExternalStore(subscribe, snap, snap); return S; }

/* small key/value storage for sync meta, sessions and keys (kept in memory too) */
const KV: Record<string, any> = {};
export async function kvLoad(keys: string[]) {
  try { const r = await AsyncStorage.multiGet(keys); r.forEach(([k, v]) => { KV[k] = v == null ? null : JSON.parse(v); }); } catch (e) { }
}
export function kvGet<T = any>(k: string, d: T): T { return KV[k] == null ? d : KV[k]; }
export function kvSet(k: string, v: any) { KV[k] = v; (v == null ? AsyncStorage.removeItem(k) : AsyncStorage.setItem(k, JSON.stringify(v))).catch(() => {}); }
export async function kvGetAsync<T = any>(k: string, d: T): Promise<T> { if (k in KV) return kvGet(k, d); try { const v = await AsyncStorage.getItem(k); KV[k] = v == null ? null : JSON.parse(v); } catch (e) { } return kvGet(k, d); }
export async function wipeAll() { try { const ks = await AsyncStorage.getAllKeys(); await AsyncStorage.multiRemove(ks.filter(k => k.startsWith('selah'))); } catch (e) { } Object.keys(KV).forEach(k => delete KV[k]); S = DEF(); emit(); }
