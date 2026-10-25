import { strToU8, strFromU8 } from 'fflate';
/* Small helpers shared by every screen. Ported one-to-one from the web app so
   ids, dates and hashes stay identical across web, Android and iOS. */

export const DAY = 864e5;
export const pad = (n: number) => String(n).padStart(2, '0');
export const dateKey = (d: Date) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
export const todayK = () => dateKey(new Date());
export const dayNum = (d: Date) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
export const periodNum = (p: string, d: Date) =>
  p === 'day' ? dayNum(d)
  : p === 'week' ? Math.floor((dayNum(d) + 3) / 7)
  : p === 'month' ? d.getFullYear() * 12 + d.getMonth()
  : d.getFullYear();
export const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };
export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const uid = (prefix: string) => prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const keyDate = (k: string) => new Date(k + 'T12:00');
export const isObj = (x: any) => !!x && typeof x === 'object' && !Array.isArray(x);
export const deepCopy = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

export function weekStart(off = 0) { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + off * 7); return d; }
export const inWeek = (ms: number, off = 0) => { const a = +weekStart(off); return ms >= a && ms < a + 7 * DAY; };

export const fmtClock = (s: number) => { s = Math.max(0, Math.floor(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + pad(m) : m) + ':' + pad(x); };
export const fmtLenEn = (s: number) => { s = Math.round(s); if (!s) return '0 min'; if (s < 60) return s + ' sec'; const m = Math.round(s / 60); if (m < 60) return m + ' min'; return Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + (m % 60) + ' min' : ''); };
export const fmtDur = (s: number) => !s || !isFinite(s) ? '' : s >= 3600 ? Math.floor(s / 3600) + ':' + pad(Math.floor(s % 3600 / 60)) + ':' + pad(Math.floor(s % 60)) : Math.floor(s / 60) + ':' + pad(Math.floor(s % 60));
export const fmtMB = (b: number) => (b / 1048576).toFixed(b < 10485760 ? 1 : 0) + ' MB';
export const money = (n: number) => '$' + (Math.round(n * 100) / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
export const numIn = (v: any) => parseFloat(String(v || '').replace(',', '.')) || 0;

/* base64 <-> bytes without relying on atob/btoa being present */
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64R = (() => { const r = new Int16Array(128).fill(-1); for (let i = 0; i < 64; i++) r[B64.charCodeAt(i)] = i; r['-'.charCodeAt(0)] = 62; r['_'.charCodeAt(0)] = 63; return r; })();
export function b64ToBytes(s: string): Uint8Array {
  s = s.replace(/[^A-Za-z0-9+/_-]/g, '');
  const n = Math.floor(s.length * 3 / 4), out = new Uint8Array(n); let o = 0;
  for (let i = 0; i < s.length; i += 4) {
    const a = B64R[s.charCodeAt(i)], b = B64R[s.charCodeAt(i + 1)], c = i + 2 < s.length ? B64R[s.charCodeAt(i + 2)] : -1, d = i + 3 < s.length ? B64R[s.charCodeAt(i + 3)] : -1;
    const v = (a << 18) | (b << 12) | ((c < 0 ? 0 : c) << 6) | (d < 0 ? 0 : d);
    if (o < n) out[o++] = (v >> 16) & 255; if (c >= 0 && o < n) out[o++] = (v >> 8) & 255; if (d >= 0 && o < n) out[o++] = v & 255;
  }
  return o === n ? out : out.slice(0, o);
}
export function bytesToB64(u: Uint8Array): string {
  let s = ''; let i = 0;
  for (; i + 2 < u.length; i += 3) { const v = (u[i] << 16) | (u[i + 1] << 8) | u[i + 2]; s += B64[v >> 18] + B64[(v >> 12) & 63] + B64[(v >> 6) & 63] + B64[v & 63]; }
  if (i < u.length) { const v = (u[i] << 16) | ((i + 1 < u.length ? u[i + 1] : 0) << 8); s += B64[v >> 18] + B64[(v >> 12) & 63] + (i + 1 < u.length ? B64[(v >> 6) & 63] : '=') + '='; }
  return s;
}
export function utf8(s: string): Uint8Array { return strToU8(s); }
export function fromUtf8(u: Uint8Array): string { return strFromU8(u); }
