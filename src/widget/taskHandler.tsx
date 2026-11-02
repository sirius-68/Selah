/* Runs when Android adds, refreshes (every 30 minutes) or resizes the widget,
   even while Selah is closed. */
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { VerseWidget } from './VerseWidget';
import { WData, WIDGET_KEY } from './data';

export async function readWidgetData(): Promise<WData | null> {
  try { const r = await AsyncStorage.getItem(WIDGET_KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; }
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
    case 'WIDGET_CLICK': {
      const d = await readWidgetData();
      props.renderWidget(<VerseWidget d={d} width={props.widgetInfo.width} height={props.widgetInfo.height} />);
      break;
    }
    default:
      break;
  }
}
