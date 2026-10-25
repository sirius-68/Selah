import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useStore, mutate } from '@/lib/store';
import { PACK, PH_PACK } from '@/lib/content';
import { parseRef, passage } from '@/lib/bible';
import { dayOpen } from '@/lib/affirm';
import { refShow, t } from '@/lib/i18n';
import { openRef } from '@/screens/bibleNav';
import { Page, toast } from '@/ui/overlay';
import { Btn, Input, Txt, useC } from '@/ui/kit';
import { AffCard } from '@/features/blocks';

export default function Day() {
  const S = useStore(); const c = useC(); const p0 = useLocalSearchParams<{ p: string; d: string }>();
  const p = PACK[p0.p], dn = +p0.d || 1;
  const jk = p ? p.id + ':' + dn : '', je = S.journal[jk];
  const [tx, setTx] = useState(je ? je.t : ''); const [cur, setCur] = useState(jk);
  if (cur !== jk) { setCur(jk); setTx(je ? je.t : ''); }
  if (!p) return <Page title=""><Txt muted>This pack isn’t available.</Txt></Page>;
  const d = p.days[dn - 1], r = parseRef(d[1]), done = (S.packs.prog[p.id] || {})[dn];
  const to = (n: number) => router.setParams({ d: String(n) });
  return (
    <Page title={t(`Day ${dn} of 7`)}>
      <AffCard k={p.k} v={dn} photo={PH_PACK[p.id]} seed={dn} tag={t(p.title)} tagTr={false} onGo={() => openRef(d[1])} aff={t(d[0])} verse={r ? passage(r) : ''} refText={refShow(d[1])} />
      <View style={{ padding: 18, borderRadius: 24, backgroundColor: c.surface, marginTop: 18, marginBottom: 12 }}>
        <Txt w={700} size={18}>Journal</Txt>
        <Txt size={16} lh={1.5} style={{ marginTop: 4 }}>{d[2]}</Txt>
      </View>
      <Input multi minH={170} value={tx} onChangeText={setTx} placeholder="Write freely. Only you can see this." />
      <Btn kind="primary" block style={{ marginTop: 14 }} label={done ? 'Update entry' : t('Save and finish day ' + dn)} tr={false} onPress={() => {
        mutate(s => { const v = tx.trim(); if (v) s.journal[jk] = { t: v, at: Date.now() }; else delete s.journal[jk]; s.packs.prog[p.id] = s.packs.prog[p.id] || {}; s.packs.prog[p.id][dn] = 1; });
        toast(dn === 7 ? 'You finished the pack. Well done.' : t('Day ' + dn + ' done'));
      }} />
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
        {dn > 1 ? <Btn icon="chevl" label={t('Day ' + (dn - 1))} tr={false} style={{ flex: 1 }} onPress={() => to(dn - 1)} /> : <View style={{ flex: 1 }} />}
        {dn < 7 ? (dayOpen(p.id, dn + 1) ? <Btn label={t('Day ' + (dn + 1))} tr={false} style={{ flex: 1 }} onPress={() => to(dn + 1)} /> : <Btn icon="lock" label={t('Unlock day ' + (dn + 1))} tr={false} style={{ flex: 1 }} onPress={() => router.push({ pathname: '/paywall', params: { pack: p.id } })} />) : <View style={{ flex: 1 }} />}
      </View>
    </Page>
  );
}
