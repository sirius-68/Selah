/* Share the widget data with the iOS widget through the App Group, then
   ask WidgetKit to redraw. */
import { ExtensionStorage } from '@bacons/apple-targets';
import { APP_GROUP } from '../widget/data';

const store = new ExtensionStorage(APP_GROUP);
export function refreshWidget(json: string) {
  try { store.set('widget', json); ExtensionStorage.reloadWidget(); } catch (e) { }
}
export const widgetPlatform = 'ios';
