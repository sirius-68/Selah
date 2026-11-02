/* App entry: Expo Router, plus the Android widget task that draws the
   home-screen widget while the app is closed. */
import 'expo-router/entry';
import { Platform } from 'react-native';

if (Platform.OS === 'android') {
  const { registerWidgetTaskHandler } = require('react-native-android-widget');
  const { widgetTaskHandler } = require('./src/widget/taskHandler');
  registerWidgetTaskHandler(widgetTaskHandler);
}
