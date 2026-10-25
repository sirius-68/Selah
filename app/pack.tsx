import React from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useStore } from '@/lib/store';
import { PACK, PH_PACK } from '@/lib/content';
import { dayOpen, ownsPack, packDone, packTag } from '@/lib/affirm';
import { money } from '@/lib/util';
import { locRefs, t } from '@/lib/i18n';
import { Page, go } from '@/ui/overlay';
import { Block, BTag, Btn, LinkBtn, ProgBar, Title, Txt, useC, tap } from '@/ui/kit';
import { Icon } from '@/ui/Icon';

export default function PackScreen() {
  const S = useStore(); const c = useC(); const { id } = useLocalSearchParams<{ id: string }>(); const p = PACK[id];
  if (!p) return <Page title=""><Txt muted>This pack isn’t available.</Txt></Page>;
  const n = packDone(p.id), own = ownsPack(p.id), prog = S.packs.prog[p.id] || {};
  return (
    <Page title="">
      <Block k={p.k} v={1} photo={PH_PACK[p.id]} radius={36} style={{ padding: 22, paddingTop: 18, paddingBottom: 24, minHeight: 300 }} art={{ size: 440, right: -150, top: -140 }}>
        <BTag label={packTag(p.id)} tr={false} />
        <View style={{ marginTop: 'auto', paddingTop: 110 }}>
          <Title a={p.t1} b={p.t2} color="#fff" size={42} />
          <Txt size={15.5} color="rgba(255,255,255,0.9)" style={{ marginTop: 10 }}>{p.blurb}</Txt>
          <ProgBar pct={n / 7} color="#fff" track="rgba(255,255,255,0.25)" h={6} style={{ marginTop: 16 }} />
          <Txt size={14} color="rgba(255,255,255,0.9)" tr={false} style={{ marginTop: 8 }}>{t(`${n} of 7 days done`)}</Txt>
        </View>
      </Block>
      {own ? null : <>
        <Btn kind="primary" block style={{ marginTop: 18 }} label={t('Unlock all 7 days for') + ' ' + money(p.price)} tr={false} onPress={() => router.push({ pathname: '/paywall', params: { pack: p.id } })} />
        <LinkBtn label="Or get every pack with Selah Plus" color={c.ink} style={{ alignSelf: 'center', marginTop: 14 }} onPress={() => router.push('/paywall')} />
      </>}
      <View style={{ gap: 8, marginTop: 20 }}>{p.days.map((d, i) => { const dn = i + 1, done = prog[dn], op = dayOpen(p.id, dn); return (
        <Pressable key={dn} onPress={() => { tap(); if (op) go('/day', { p: p.id, d: String(dn) }); else router.push({ pathname: '/paywall', params: { pack: p.id } }); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 22, backgroundColor: c.surface, opacity: op ? 1 : 0.7 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: done ? '#23C25F' : c.surface2, alignItems: 'center', justifyContent: 'center' }}>{done ? <Icon name="check" size={18} color="#06341B" stroke={2.6} /> : <Txt w={700} tr={false}>{String(dn)}</Txt>}</View>
          <View style={{ flex: 1 }}><Txt w={700} size={15.5}>{d[0]}</Txt><Txt muted size={13} tr={false}>{t('Day ' + dn) + ', ' + locRefs(d[1])}</Txt></View>
          <Icon name={op ? 'chevr' : 'lock'} size={18} color={c.muted} />
        </Pressable>); })}</View>
    </Page>
  );
}
