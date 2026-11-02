/* The iOS home-screen and lock-screen widget (WidgetKit + SwiftUI).
   It reads the words the app shares through the App Group. */
/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  name: 'SelahWidget',
  displayName: 'Selah',
  deploymentTarget: '17.0',
  frameworks: ['SwiftUI', 'WidgetKit'],
  colors: {
    $accent: '#B6AEFF',
    $widgetBackground: '#B6AEFF',
  },
  entitlements: {
    'com.apple.security.application-groups': config.ios.entitlements['com.apple.security.application-groups'],
  },
});
