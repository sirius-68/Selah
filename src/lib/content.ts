/* Everything the web app kept as constants, exported once from its source
   (affirmations, packs, scapes, Break free kinds, prayer themes, colours). */
import raw from '../data/content.json';

const C: any = raw;

export type Theme = { n: string; bg: string; t: string; r1: [string, string]; r2: [string, string] };
export type ThemeKey = 'dawn' | 'day' | 'dusk' | 'night' | 'grove' | 'ember';
export type Pack = { id: string; k: ThemeKey; price: number; t1: string; t2: string; blurb: string; days: [string, string, string][]; title: string };
export type Kind = { n: string; k: ThemeKey; med?: boolean; v: string[]; t: string[] };
export type Scape = { id: string; n: string; s: string; k: ThemeKey; free?: boolean };

export const CT: Record<ThemeKey, Theme> = C.CT;
export const CT_KEYS = Object.keys(CT) as ThemeKey[];
export const TCOL: Record<string, ThemeKey> = C.TCOL;
export const QCOL: ThemeKey[] = C.QCOL;
export const RP: [string, string][] = C.RP;
export const THEMES: string[] = C.THEMES;
export const AFFS: { theme: string; ref: string; a: string }[] = C.AFFS;
export const BOOKS: string[] = C.BOOKS;
export const BOOKS_L: Record<string, string[]> = C.BOOKS_L;
export const PSALM_SG: Record<string, string> = C.PSALM_SG;
export const LANGS: Record<string, { n: string; loc: string }> = C.LANGS;
export const VERS: Record<string, { n: string; sub: string; abbr: string; lang: string; loc: string }> = C.VERS;
export const PACKS: Pack[] = C.PACKS.map((p: any) => ({ ...p, title: p.t1 + ' ' + p.t2.replace(/\.$/, '') }));
export const PACK: Record<string, Pack> = Object.fromEntries(PACKS.map(p => [p.id, p]));
export const SCAPES: Scape[] = C.SCAPES;
export const SCP: Record<string, Scape> = Object.fromEntries(SCAPES.map(s => [s.id, s]));
export const KINDS: Record<string, Kind> = C.KINDS;
export const TPLS: { name: string; theme: string; time: string; period: string; d: string }[] = C.TPLS;
export const URV: Record<string, string[]> = C.URV;
export const URK: Record<string, ThemeKey> = C.URK;
export const WATCHES: [string, string][] = C.WATCHES;
export const MOODS: Record<string, { th: string[]; note: string }> = C.MOODS;
export const KW: [RegExp, string][] = C.KW.map(([src, t]: [string, string]) => [new RegExp(src, 'i'), t]);
export const TNOTE: Record<string, string> = C.TNOTE;
export const NC: Record<string, { n: string; c: string }> = C.NC;
export const BICONS: string[] = C.BICONS;
export const JPROMPTS: string[] = C.JPROMPTS;
export const JMOODS: string[] = C.JMOODS;
export const RMOODS: string[] = C.RMOODS;
export const GEN_V: string[] = C.GEN_V;
export const VAFF: Record<string, string> = C.VAFF;
export const GEN_T: string[] = C.GEN_T;
export const MILES: number[] = C.MILES;
export const PLANS: Record<string, { name: string; price: number; per: string; note: string; trial?: number; badge?: string }> = C.PLANS;
export const ROT: Record<string, string> = C.ROT;
export const WDEF = C.WDEF as { size: string; style: ThemeKey; content: string; rotate: string; font: string };
export const TRIG_BASE: string[] = C.TRIG_BASE;
export const TRIG_KIND: Record<string, string[]> = C.TRIG_KIND;
export const REASON_SUG: string[] = C.REASON_SUG;
export const PLAN_SUG: Record<string, string> = C.PLAN_SUG;
export const MDESC: Record<string, string> = C.MDESC;
export const SMOKE_HEALTH: [number, string, string][] = C.SMOKE_HEALTH;
export const SOS_PRAYER: string = C.SOS_PRAYER;
export const ONB: { ph: string; k: ThemeKey; a: string; b: string; p: string; pts: string[] }[] = C.ONB;
export const PEVERY: Record<string, string> = C.PEVERY;
export const DNAMES: string[] = C.DNAMES;
export const FREE_GUIDE: number = C.FREE_GUIDE;
export const SEG = 8 * 60;

/* photos (Unsplash CDN), with fallbacks per slot */
export const PH: Record<string, string[]> = C.PH;
export const PH_THEME: Record<string, string> = C.PH_THEME;
export const PH_PACK: Record<string, string> = C.PH_PACK;
export const PH_SCAPE: Record<string, string> = C.PH_SCAPE;
export const PH_KIND: Record<string, string> = C.PH_KIND;
export const PH_FEAT: Record<string, string> = C.PH_FEAT;
export const PH_ROTA: string[] = C.PH_ROTA;
export const CARD_BG: string[] = C.CARD_BG;
export const phUrl = (id: string, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;
export const phTheme = (t: string, seed = 0) => PH_THEME[t] || ['peace', 'faith', 'sunrise', 'forest', 'flowers'][Math.abs(seed) % 5];

export const SUPABASE = {
  url: 'https://hbgguyeweyqleuowvuml.supabase.co',
  key: 'sb_publishable_m5K1dsGeJsI6B8s7vbARKg_K0ItfAgY',
};
/* Test mode: sign-in skips form checks and Supabase. Set to false before launch. */
export const TEST_AUTH = true;
