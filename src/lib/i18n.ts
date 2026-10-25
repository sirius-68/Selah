/* Translation: the same English-keyed French and Russian dictionaries as the
   web app, with the same pattern rules ({n} numbers with plural forms, {r}
   Bible references, 12-hour times turned into 24-hour times). */
import fr from '../i18n/fr.json';
import ru from '../i18n/ru.json';
import { S } from './store';
import { BOOKS, BOOKS_L, LANGS, PSALM_SG, VERS } from './content';

const D: Record<string, Record<string, string>> = { fr: fr as any, ru: ru as any };
export const L = () => (S.settings && S.settings.lang) || 'en';
export const LOC = () => (LANGS[L()] || LANGS.en).loc;
export const VA = () => (VERS[S.settings.ver] || VERS.kjv).abbr;

export const bookName = (i: number, sing?: boolean) => { const l = L(); if (l === 'en') return sing && i === 18 ? 'Psalm' : BOOKS[i]; return sing && i === 18 ? PSALM_SG[l] : BOOKS_L[l][i]; };
const REF_NAMES = [...BOOKS, 'Psalm'].sort((a, b) => b.length - a.length).map(n => n.replace(/ /g, '\\s'));
const REF_SRC = '\\b(' + REF_NAMES.join('|') + ')\\s(\\d+)(?::(\\d+)(?:-(\\d+))?)?(?:,\\s?\\d+(?:-\\d+)?)*';
const refRx = () => new RegExp(REF_SRC, 'g');
/* "Psalm 23:1" -> "Psaume 23:1" / "Псалом 23:1" */
export function locRefs(s: string) { if (L() === 'en') return s; return s.replace(refRx(), (m, b) => { const i = b === 'Psalm' ? 18 : BOOKS.indexOf(b); return i < 0 ? m : bookName(i, b === 'Psalm') + m.slice(b.length); }); }

export function plur(n: any, forms: string[]) {
  const l = L(); n = Math.abs(+n);
  if (l === 'ru') { const a = n % 10, b = n % 100; return forms[(a === 1 && b !== 11) ? 0 : (a >= 2 && a <= 4 && (b < 12 || b > 14)) ? 1 : 2] || forms[forms.length - 1]; }
  return forms[n <= 1 ? 0 : 1] || forms[0];
}

/* translate one English string */
export function t(s: string | null | undefined): string {
  if (s == null) return '';
  if (L() === 'en') return s;
  const raw = String(s), lead = raw.match(/^\s*/)![0], trail = raw.match(/\s*$/)![0]; let x = raw.trim(); if (!x) return raw;
  const Dl = D[L()]; if (!Dl) return raw;
  if (Dl[x] !== undefined) return lead + Dl[x] + trail;
  if (/\d\s?(AM|PM|a\.m\.|p\.m\.)/i.test(x)) {
    x = x.replace(/(\d{1,2})(?::(\d\d))?\s?(AM|PM|a\.m\.|p\.m\.)/gi, (m, h, mm, ap) => { const hh = (+h % 12) + (/^p/i.test(ap) ? 12 : 0); return String(hh).padStart(2, '0') + ':' + (mm || '00'); });
    if (Dl[x] !== undefined) return lead + Dl[x] + trail;
  }
  const refs: string[] = []; let k = x.replace(refRx(), m => { refs.push(m); return '{r}'; });
  const nums: string[] = []; k = k.replace(/\d+(?:[.,:]\d+)*/g, m => { nums.push(m); return '{n}'; });
  if (k !== x && Dl[k] !== undefined) {
    let i = 0, j = 0;
    const out = Dl[k].replace(/\{n(?:\|([^}]*))?\}/g, (_m, f) => { const n = nums[i++]; return f ? n + ' ' + plur(n.replace(',', '.'), f.split('|')) : n; })
      .replace(/\{w\|([^}]*)\}/g, (_m, f) => plur(nums[Math.max(0, i - 1)], f.split('|')))
      .replace(/\{r\}/g, () => locRefs(refs[j++] || ''));
    return lead + out + trail;
  }
  return lead + locRefs(x).replace(/\bKJV\b/g, VA()) + trail;
}
/* translate a template that has {n} slots: tf('{n} days free', 3) */
export function tf(s: string, ...vals: (string | number)[]) { let i = 0; return t(s.replace(/\{n\}/g, () => String(vals[i++]))); }
/* "3 days" with English plural, then translated as a whole */
export const plural = (n: number, one: string, many?: string) => `${n} ${n === 1 ? one : (many || one + 's')}`;

/* dates and times in the user's language */
export function fmtTime(hm: string | null | undefined) {
  if (!hm) return ''; const [h, m] = hm.split(':').map(Number);
  try { return new Date(2000, 0, 1, h, m).toLocaleTimeString(LOC(), { hour: 'numeric', minute: '2-digit' }); } catch (e) { return hm; }
}
export const fmtDate = (d: Date | number, o: Intl.DateTimeFormatOptions) => { try { return new Date(d).toLocaleDateString(LOC(), o); } catch (e) { return new Date(d).toDateString(); } };
export const fmtClockTime = (d: Date | number) => { try { return new Date(d).toLocaleTimeString(LOC(), { hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; } };
/* a reference shown to the reader: localized book name + version abbreviation */
export const refShow = (ref: string) => locRefs(ref) + ' ' + VA();
