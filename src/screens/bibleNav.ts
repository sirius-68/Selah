/* Where the Bible tab is (home, chapter list, reading) and how other screens open it. */
import { router } from 'expo-router';
import { parseRef } from '../lib/bible';
import { mutate } from '../lib/store';

export type BibleUI = { mode: 'home' | 'chapters' | 'read'; b: number; c: number; testament: 'ot' | 'nt'; sel: number[]; focusSearch: number; scrollTo: number; q: string; hlOpen: boolean };
export const BUI: BibleUI = { mode: 'home', b: 0, c: 1, testament: 'nt', sel: [], focusSearch: 0, scrollTo: 0, q: '', hlOpen: false };
const subs = new Set<() => void>();
export const onBibleUI = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
export const bibleUIChanged = () => subs.forEach(f => f());

export function openChapter(b: number, c: number, v1 = 0, v2 = 0) {
  BUI.mode = 'read'; BUI.b = b; BUI.c = c; BUI.hlOpen = false; BUI.sel = [];
  if (v1) for (let v = v1; v <= (v2 || v1); v++) BUI.sel.push(v);
  BUI.scrollTo = v1 || 0;
  mutate(s => { s.pos = { b, c }; });
  bibleUIChanged();
  router.navigate('/(tabs)/bible' as any);
}
export function openRef(ref: string) { const r = parseRef(String(ref).split(',')[0]); if (r) openChapter(r.b, r.c, r.v1, r.v2); }
export function openBibleSearch() { BUI.mode = 'home'; BUI.sel = []; BUI.focusSearch++; bibleUIChanged(); router.navigate('/(tabs)/bible' as any); }
