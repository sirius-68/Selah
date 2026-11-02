/* The widget's saved data and how it picks the words to show. Kept free of
   app imports so the Android widget task can run it without the app open.
   The iOS widget (targets/widget/Widget.swift) uses the same rules. */
export const WIDGET_KEY = 'selah.widget';
export const APP_GROUP = 'group.app.selah.prayer';

export type WItem = { a: string; v: string; r: string };
export type WDesign = { size: string; style: string; content: string; rotate: string; font: string; bg: string; fg: string };
export type WData = { w: WDesign; items: WItem[]; at: number; brand: string };

/* hours between new words for each "New words" choice */
export const ROT_H: Record<string, number> = { '1h': 1, '3h': 3, 'am-pm': 12, '1d': 24 };

/* the item for a moment in time: the day is cut into equal slots in local time */
export function pickItem(d: WData, now = Date.now()): WItem | null {
  const n = d.items.length; if (!n) return null;
  const h = ROT_H[d.w.rotate] || 3;
  const localHours = now / 36e5 - new Date(now).getTimezoneOffset() / 60;
  const slot = Math.floor(localHours / h);
  return d.items[((slot % n) + n) % n];
}
