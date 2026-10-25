import React, { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { fmtDate, fmtTime } from '../lib/i18n';
import { pad } from '../lib/util';
import { Input, Txt, useC, tap } from '../ui/kit';
import { Icon } from '../ui/Icon';

const toDate = (hm: string) => { const [h, m] = (hm || '06:30').split(':').map(Number); const d = new Date(); d.setHours(h || 0, m || 0, 0, 0); return d; };

/* a time of day as "HH:MM" (native picker on phones, typed on the web) */
export function TimeField({ value, onChange, allowEmpty, placeholder }: { value: string; onChange: (v: string) => void; allowEmpty?: boolean; placeholder?: string }) {
  const c = useC(); const [open, setOpen] = useState(false);
  if (Platform.OS === 'web') return <Input value={value} placeholder={placeholder || 'HH:MM'} onChangeText={v => onChange(v.replace(/[^\d:]/g, '').slice(0, 5))} />;
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable accessibilityRole="button" onPress={() => { tap(); setOpen(!open); }} style={{ flex: 1, minHeight: 52, borderRadius: 18, backgroundColor: c.surface2, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Txt size={16} tr={false} color={value ? c.ink : c.muted}>{value ? fmtTime(value) : (placeholder || 'Off')}</Txt>
          <Icon name="clock" size={20} color={c.muted} />
        </Pressable>
        {allowEmpty && value ? <Pressable accessibilityLabel="Turn off" onPress={() => onChange('')} style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}><Icon name="x" color={c.muted} /></Pressable> : null}
      </View>
      {open ? (
        <DateTimePicker value={toDate(value)} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} themeVariant={c.dark ? 'dark' : 'light'}
          onChange={(e: any, d?: Date) => { if (Platform.OS !== 'ios') setOpen(false); if (e.type === 'dismissed' || !d) return; onChange(pad(d.getHours()) + ':' + pad(d.getMinutes())); }} />
      ) : null}
    </View>
  );
}

/* a moment in the past (date and time) */
export function DateTimeField({ value, onChange }: { value: number | null; onChange: (ms: number) => void }) {
  const c = useC(); const [mode, setMode] = useState<'date' | 'time' | null>(null);
  const d = value ? new Date(value) : new Date();
  if (Platform.OS === 'web') {
    const str = value ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}` : '';
    return <Input value={str} placeholder="YYYY-MM-DD HH:MM" onChangeText={v => { const m = v.match(/^(\d{4})-(\d\d)-(\d\d)[ T](\d\d):(\d\d)$/); if (m) onChange(new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]).getTime()); }} />;
  }
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable onPress={() => setMode('date')} style={{ flex: 1.4, minHeight: 52, borderRadius: 18, backgroundColor: c.surface2, paddingHorizontal: 16, justifyContent: 'center' }}><Txt tr={false}>{value ? fmtDate(d, { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}</Txt></Pressable>
        <Pressable onPress={() => setMode('time')} style={{ flex: 1, minHeight: 52, borderRadius: 18, backgroundColor: c.surface2, paddingHorizontal: 16, justifyContent: 'center' }}><Txt tr={false}>{value ? fmtTime(pad(d.getHours()) + ':' + pad(d.getMinutes())) : '—'}</Txt></Pressable>
      </View>
      {mode ? <DateTimePicker value={d} mode={mode} maximumDate={new Date()} display={Platform.OS === 'ios' ? 'spinner' : 'default'} themeVariant={c.dark ? 'dark' : 'light'}
        onChange={(e: any, nd?: Date) => { if (Platform.OS !== 'ios') setMode(null); if (e.type === 'dismissed' || !nd) return; onChange(Math.min(Date.now(), nd.getTime())); }} /> : null}
    </View>
  );
}
