/* Redraw every Selah widget on the Android home screen. */
import React from 'react';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { VerseWidget } from '../widget/VerseWidget';

export function refreshWidget(json: string) {
  try {
    const d = JSON.parse(json);
    requestWidgetUpdate({ widgetName: 'Selah', renderWidget: info => <VerseWidget d={d} width={info.width} height={info.height} />, widgetNotFound: () => {} }).catch(() => {});
  } catch (e) { }
}
export const widgetPlatform = 'android';
