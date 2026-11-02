/* Data for the home-screen widget: the saved design plus a rotating list of
   affirmations with their verses, so the widget can render without the app. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { S } from './store';
import { ALL, passage, refLabel } from './bible';
import { WDEF } from './content';
import { t, refShow } from './i18n';

export const WIDGET_KEY = 'selah.widget';
export async function syncWidget() {
  try {
    const w = Object.assign({}, WDEF, S.widget || {});
    const items = ALL.slice(0, 48).map(it => ({ a: t(it.a), v: passage(it.r), r: refShow(refLabel(it.r)) }));
    await AsyncStorage.setItem(WIDGET_KEY, JSON.stringify({ w, items, plus: !!S.plus, at: Date.now() }));
    const mod = await import('./widgetNative').catch(() => null);
    if (mod && mod.refreshWidget) mod.refreshWidget();
  } catch (e) { }
}
