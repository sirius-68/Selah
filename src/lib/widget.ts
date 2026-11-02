/* Data for the home-screen widget: the design plus a rotating list of
   affirmations with their verses, so the widget can render without the app.
   Everyone gets the widget; Selah Plus unlocks a custom design. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { S, onSave } from './store';
import { ALL, passage, refLabel } from './bible';
import { CT, ThemeKey, WDEF } from './content';
import { t, refShow } from './i18n';
import { isPlus } from './affirm';
import { dayNum } from './util';
import { WData, WIDGET_KEY } from '../widget/data';
import { refreshWidget } from './widgetNative';

export function widgetDesign() { return Object.assign({}, WDEF, (isPlus() && S.widget) || {}); }

export function widgetData(): WData {
  const w = widgetDesign(), T = CT[w.style as ThemeKey] || CT.dusk;
  const n = ALL.length, off = n ? (dayNum(new Date()) * 7) % n : 0;
  const items = Array.from({ length: Math.min(48, n) }, (_, i) => ALL[(off + i) % n])
    .map(it => ({ a: t(it.a), v: passage(it.r), r: refShow(refLabel(it.r)) }));
  return { w: { ...w, bg: T.bg, fg: T.t }, items, at: Date.now(), brand: 'Selah' };
}

let last = '';
export async function syncWidget() {
  try {
    const d = widgetData(); if (!d.items.length) return;
    const key = JSON.stringify([d.w, d.items[0], d.items.length, S.settings.lang, S.settings.ver]);
    const json = JSON.stringify(d);
    await AsyncStorage.setItem(WIDGET_KEY, json);
    if (key === last) return; last = key;
    refreshWidget(json);
  } catch (e) { }
}

/* keep the widget fresh: at start, then after changes (language, version, design, Plus) */
let tm: any = null;
export function bootWidget() {
  syncWidget();
  onSave(() => { clearTimeout(tm); tm = setTimeout(syncWidget, 2500); });
}
