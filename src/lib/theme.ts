/* Design tokens from the web app's CSS variables, for light and dark. */
import { useColorScheme } from 'react-native';
import { useStore } from './store';
import { CT, ThemeKey } from './content';

export const BRAND = { lemon: '#F4F01E', forest: '#0D4A30', leaf: '#23C25F', gum: '#FFB0D4', ox: '#5A0B13', lav: '#B6AEFF' };
const light = {
  dark: false,
  bg: '#F3EFF6', bg2: '#E6DCF0', surface: '#FFFFFF', surface2: '#EAE3F0', ink: '#17101F', muted: '#665C73', line: '#DDD5E5',
  accent: '#5B48E0', pill: '#17101F', onPill: '#FFFFFF', paper: '#FFFFFF', paperInk: '#17101F', danger: '#B4232F',
  navbg: '#17101F', navfg: '#F4EFF8', navact: '#F4EFF8', navactfg: '#17101F',
  hl: ['rgba(244,240,30,0.6)', 'rgba(35,194,95,0.32)', 'rgba(182,174,255,0.6)', 'rgba(255,176,212,0.7)'],
};
const dark: typeof light = {
  ...light, dark: true,
  bg: '#130D1B', bg2: '#2A1A3A', surface: '#1E1628', surface2: '#2B2236', ink: '#F4EFF8', muted: '#A99EB7', line: '#342A40',
  accent: '#B6AEFF', pill: '#F4EFF8', onPill: '#130D1B', danger: '#FF8597',
  navbg: '#F4EFF8', navfg: '#17101F', navact: '#17101F', navactfg: '#F4EFF8',
  hl: ['rgba(244,240,30,0.26)', 'rgba(35,194,95,0.32)', 'rgba(182,174,255,0.34)', 'rgba(255,176,212,0.3)'],
};
export type Colors = typeof light;
export const DARK_ROOM: Colors = { ...dark, bg: '#0D0914' };

export function useColors(): Colors {
  const S = useStore(); const sys = useColorScheme();
  const th = S.settings.theme;
  return th === 'light' ? light : th === 'dark' ? dark : (sys === 'light' ? light : dark);
}
export const colorsFor = (isDark: boolean) => isDark ? dark : light;

/* fonts (Bricolage Grotesque for UI, Newsreader for serif reading, Caveat for sticky notes) */
export const F: Record<number, string> = {
  300: 'BricolageGrotesque_300Light', 400: 'BricolageGrotesque_400Regular', 500: 'BricolageGrotesque_500Medium',
  600: 'BricolageGrotesque_600SemiBold', 700: 'BricolageGrotesque_700Bold', 800: 'BricolageGrotesque_800ExtraBold',
};
export const SERIF = 'Newsreader_400Regular';
export const HAND = 'Caveat_500Medium';
export const HAND_B = 'Caveat_700Bold';

export const block = (k: ThemeKey | string) => { const T = CT[k as ThemeKey] || CT.dusk; return { cb: T.bg, ci: T.t, T }; };
/* colour mixing helpers (CSS color-mix stand-ins) */
export function hexA(hex: string, a: number) {
  const h = hex.replace('#', ''); const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
export const timeTheme = (h: number): ThemeKey => h >= 4 && h < 10 ? 'dawn' : h >= 10 && h < 17 ? 'day' : h >= 17 && h < 20 ? 'dusk' : 'night';
