import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router';
import { SND, scapeInfo, stopScape } from '../lib/sound';
import { useSound } from '../lib/hooks';
import { Txt, shadow, tap } from '../ui/kit';
import { Icon } from '../ui/Icon';
import { go } from '../ui/overlay';

/* the small green "now playing" pill above the navigation */
export function NowPlaying() {
  useSound(); const ins = useSafeAreaInsets(); const path = usePathname();
  if (!SND.playing || SND.session || path === '/audio' || path.startsWith('/ur/run')) return null;
  const inTabs = ['/', '/explore', '/goals', '/saved', '/bible'].includes(path);
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: (inTabs ? 88 : 18) + ins.bottom, alignItems: 'center', zIndex: 50 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, padding: 5, borderRadius: 999, backgroundColor: '#0D4A30', maxWidth: '86%', ...shadow(12, 0.35) }}>
        <Pressable onPress={() => go('/audio')} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 12, paddingRight: 10, minHeight: 40, flexShrink: 1 }}>
          <Icon name="wave" size={20} color="#E8F27A" />
          <Txt w={600} size={14} color="#E8F27A" tr={false} numberOfLines={1}>{scapeInfo(SND.cur || 'rain').n}</Txt>
        </Pressable>
        <Pressable accessibilityLabel="Stop" onPress={() => { tap(); stopScape(); }} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><Icon name="pause" size={20} color="#17101F" /></Pressable>
      </View>
    </View>
  );
}
