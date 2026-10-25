/* The Bible: four public-domain versions shipped as gzip assets, all aligned
   to KJV chapters and verses, plus reference parsing and the affirmation pool. */
import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import * as FS from 'expo-file-system/legacy';
import { gunzipSync, strFromU8 } from 'fflate';
import { AFFS, BOOKS, BOOKS_L, PSALM_SG, THEMES, VERS } from './content';
import { b64ToBytes } from './util';

type Bible = string[][][];
const FILES: Record<string, number> = {
  kjv: require('../../assets/bibles/kjv.json.gz'),
  lsg: require('../../assets/bibles/lsg.json.gz'),
  dby: require('../../assets/bibles/dby.json.gz'),
  syn: require('../../assets/bibles/syn.json.gz'),
};
export const NT_START = 39;
const CACHE: Record<string, Bible> = {};
export let BIBLE: Bible = [];
export let KJV: Bible = [];
export let currentVersion = 'kjv';
let bibleVer = 0;
export const bibleVersion = () => bibleVer;

async function readBytes(id: string): Promise<Uint8Array> {
  const asset = Asset.fromModule(FILES[id]);
  if (Platform.OS === 'web') {
    const r = await fetch(asset.uri); return new Uint8Array(await r.arrayBuffer());
  }
  await asset.downloadAsync();
  const b64 = await FS.readAsStringAsync(asset.localUri || asset.uri, { encoding: FS.EncodingType.Base64 });
  return b64ToBytes(b64);
}
export async function loadVersion(id: string): Promise<Bible> {
  if (CACHE[id]) return CACHE[id];
  let u8 = await readBytes(id);
  // a web server may already have unzipped it for us
  if (u8[0] === 0x1f && u8[1] === 0x8b) u8 = gunzipSync(u8);
  const data: Bible = JSON.parse(strFromU8(u8));
  data.forEach(bk => bk.forEach(ch => { if (ch[0]) ch[0] = ch[0].charAt(0).toUpperCase() + ch[0].slice(1); }));
  CACHE[id] = data; return data;
}
export async function initBible(ver: string) {
  KJV = await loadVersion('kjv'); BIBLE = KJV; currentVersion = 'kjv';
  if (ver && ver !== 'kjv' && VERS[ver]) { try { BIBLE = await loadVersion(ver); currentVersion = ver; } catch (e) { } }
  bibleVer++;
}
export async function useVersion(ver: string) {
  const d = await loadVersion(ver); BIBLE = d; currentVersion = ver; bibleVer++; FLAT = null;
}

/* ---------- references ---------- */
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const BOOKN = BOOKS.map(norm);
export type Ref = { b: number; c: number; v1: number; v2: number; hasC?: boolean };
function parseRefEn(s: string): Ref | null {
  const m = String(s).trim().match(/^((?:[1-3]\s*)?[a-z][a-z .]*?)\s*(\d+)?(?:\s*[: ]\s*(\d+)(?:\s*[-–]\s*(\d+))?)?$/i);
  if (!m) return null;
  const n = norm(m[1]); if (!n) return null;
  let b = BOOKN.indexOf(n); if (b < 0) b = BOOKN.findIndex(x => x.startsWith(n));
  if (b < 0) return null;
  const hasC = !!m[2];
  let c = hasC ? parseInt(m[2], 10) : 1;
  c = Math.max(1, Math.min(c, KJV[b].length));
  let v1 = m[3] ? parseInt(m[3], 10) : 0, v2 = m[4] ? parseInt(m[4], 10) : 0;
  const max = KJV[b][c - 1].length;
  if (v1) v1 = Math.min(v1, max); if (v2) v2 = Math.min(Math.max(v2, v1), max);
  return { b, c, v1, v2, hasC };
}
const normL = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9Ѐ-ӿ]/g, '');
/* also understands French and Russian book names */
export function parseRef(s: string): Ref | null {
  if (!KJV.length) return null;
  const r = parseRefEn(s); if (r) return r;
  const m = String(s).trim().match(/^((?:[1-4]\s*)?[^\d:]+?)\s*(\d+)?(?:\s*[: ]\s*(\d+)(?:\s*[-–]\s*(\d+))?)?$/u); if (!m) return null;
  const n = normL(m[1]); if (!n) return null;
  for (const l of ['fr', 'ru']) {
    const names = BOOKS_L[l].map(normL); let b = names.indexOf(n);
    if (b < 0) b = names.findIndex(x => x.startsWith(n) && n.length >= 3);
    if (b < 0 && normL(PSALM_SG[l]).startsWith(n) && n.length >= 3) b = 18;
    if (b >= 0) return parseRefEn(BOOKS[b] + (m[2] ? ' ' + m[2] : '') + (m[3] ? ':' + m[3] : '') + (m[4] ? '-' + m[4] : ''));
  }
  return null;
}
export function refLabel(r: Ref) {
  let n = BOOKS[r.b]; if (n === 'Psalms') n = 'Psalm';
  let s = n + ' ' + r.c;
  if (r.v1) s += ':' + r.v1 + (r.v2 && r.v2 !== r.v1 ? '-' + r.v2 : '');
  return s;
}
export function chapter(b: number, c: number): string[] {
  const vs = (BIBLE[b] && BIBLE[b][c - 1]) || [], k = KJV[b][c - 1];
  return k.map((t, i) => vs[i] || (currentVersion === 'kjv' ? t : ''));
}
export function verseText(b: number, c: number, v: number) { const vs = BIBLE[b] && BIBLE[b][c - 1]; return (vs && vs[v - 1]) || KJV[b][c - 1][v - 1] || ''; }
export function passage(r: Ref | null): string {
  if (!r) return '';
  const len = KJV[r.b][r.c - 1].length, a = r.v1 || 1, z = r.v2 || r.v1 || len, out: string[] = [];
  const vs = (BIBLE[r.b] && BIBLE[r.b][r.c - 1]) || [];
  // merged verses are empty in some versions; they are simply skipped
  for (let v = a; v <= z; v++) { const t = vs[v - 1]; if (t) out.push(t); }
  return out.join(' ') || KJV[r.b][r.c - 1].slice(a - 1, z).join(' ');
}
export const passageOf = (ref: string) => passage(parseRef(String(ref).split(',')[0]));
export const keyParts = (k: string) => { const [b, c, v] = k.split('.').map(Number); return { b, c, v }; };
export const cmpKey = (a: string, b: string) => { const x = keyParts(a), y = keyParts(b); return x.b - y.b || x.c - y.c || x.v - y.v; };
export const verseRefOf = (k: string): Ref => { const p = keyParts(k); return { b: p.b, c: p.c, v1: p.v, v2: p.v }; };
export function prevCh(b: number, c: number) { if (c > 1) return { b, c: c - 1 }; if (b > 0) return { b: b - 1, c: KJV[b - 1].length }; return null; }
export function nextCh(b: number, c: number) { if (c < KJV[b].length) return { b, c: c + 1 }; if (b < 65) return { b: b + 1, c: 1 }; return null; }

/* ---------- search ---------- */
let FLAT: [number, number, number, string][] | null = null;
export function search(q: string, limit = 60) {
  const terms = q.toLowerCase().split(/\s+/).filter(t => t.length > 1);
  if (!terms.length || q.length < 3) return { total: 0, hits: [] as [number, number, number][], terms };
  if (!FLAT) { FLAT = []; BIBLE.forEach((bk, b) => bk.forEach((ch, c) => ch.forEach((t, v) => { if (t) FLAT!.push([b, c + 1, v + 1, t.toLowerCase()]); }))); }
  const hits: [number, number, number][] = []; let total = 0;
  for (const row of FLAT) { if (terms.every(t => row[3].includes(t))) { total++; if (hits.length < limit) hits.push([row[0], row[1], row[2]]); } }
  return { total, hits, terms };
}

/* ---------- affirmations ---------- */
export type Item = { t: string; r: Ref; a: string; id: string; ref: string };
export let ITEMS: Item[] = [];
export const BYTHEME: Record<string, Item[]> = {};
export let ALL: Item[] = [];
export function buildItems() {
  ITEMS = AFFS.map(x => { const r = parseRef(x.ref); return r ? { t: x.theme, r, a: x.a, id: x.ref + '|' + x.a, ref: x.ref } : null; }).filter(Boolean) as Item[];
  THEMES.forEach(t => BYTHEME[t] = ITEMS.filter(i => i.t === t));
  ALL = []; for (let k = 0; k < 6; k++) THEMES.forEach(t => { if (BYTHEME[t][k]) ALL.push(BYTHEME[t][k]); });
}
