import React, { useState } from 'react';
import { View } from 'react-native';
import { useStore, mutate } from '@/lib/store';
import { t } from '@/lib/i18n';
import { Page, toast } from '@/ui/overlay';
import { Empty, Mini, Txt, useC } from '@/ui/kit';
import { Icon } from '@/ui/Icon';

export default function Trash() {
  const S = useStore(); const c = useC(); const [armed, setArmed] = useState<string | null>(null);
  const ts = S.jn.notes.filter((n: any) => n.trash).sort((a: any, b: any) => b.trash - a.trash);
  return (
    <Page title="Recently deleted">
      <Txt muted size={16} style={{ marginBottom: 18 }}>Deleted entries stay here for 30 days, then they’re gone for good.</Txt>
      {ts.length ? ts.map((n: any) => (
        <View key={n.id} style={{ backgroundColor: c.surface, borderRadius: 26, padding: 18, paddingBottom: 14, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Icon name="journal" size={18} color={c.ink} /><Txt w={700} tr={false}>{n.title || t('Untitled entry')}</Txt></View>
          <Txt muted size={14} tr={false} style={{ marginTop: 4 }}>{(n.body || '').slice(0, 140)}</Txt>
          <Mini items={[
            ['shuffle', 'Restore', () => { mutate(s => { const x = s.jn.notes.find((y: any) => y.id === n.id); x.trash = null; if (!s.jn.books.some((b: any) => b.id === x.book)) x.book = s.jn.books[0].id; }); toast('Entry restored'); }],
            ['x', armed === n.id ? 'Tap again to delete forever' : 'Delete forever', () => { if (armed !== n.id) { setArmed(n.id); return; } mutate(s => { s.jn.notes = s.jn.notes.filter((y: any) => y.id !== n.id); }); setArmed(null); toast('Deleted forever'); }],
          ]} />
        </View>)) : <Empty title="Nothing here" body={t('Entries you delete will wait here for 30 days.')} />}
    </Page>
  );
}
