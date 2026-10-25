import React, { useEffect, useReducer } from 'react';
import { Pressable, View } from 'react-native';
import { ALERTS, dismissAlert, onAlerts, openAlert } from '../lib/notify';
import { Txt } from '../ui/kit';
import { Icon } from '../ui/Icon';

/* reminders that arrive while Selah is open show here, like the web banner */
export function AlertBanner() {
  const [, f] = useReducer(x => x + 1, 0);
  useEffect(() => onAlerts(f), []);
  if (!ALERTS.length) return null;
  return (
    <View style={{ gap: 14, marginBottom: 14 }}>
      {ALERTS.map((a, i) => (
        <View key={i} accessibilityRole="alert" style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 16, borderRadius: 26, backgroundColor: '#F4F01E' }}>
          <Icon name="bell" color="#17101F" />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt w={700} color="#17101F" tr={false}>{a.title}</Txt>
            <Txt size={14.5} color="rgba(23,16,31,0.85)" tr={false} style={{ marginTop: 2 }}>{a.body}</Txt>
          </View>
          <Pressable onPress={() => { dismissAlert(i); openAlert(a); }} style={{ minHeight: 40, paddingHorizontal: 16, borderRadius: 999, backgroundColor: '#17101F', justifyContent: 'center' }}><Txt w={600} size={14} color="#fff">Open</Txt></Pressable>
          <Pressable accessibilityLabel="Dismiss" onPress={() => dismissAlert(i)} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', opacity: 0.7 }}><Icon name="x" color="#17101F" /></Pressable>
        </View>
      ))}
    </View>
  );
}
