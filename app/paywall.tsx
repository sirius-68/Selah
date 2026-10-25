/* Selah Plus and pack purchases. Payments are a test-mode stub: in the stores
   these become Google Play Billing / StoreKit (e.g. through RevenueCat). */
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useStore, mutate } from '@/lib/store';
import { PACK, PLANS, CT } from '@/lib/content';
import { money } from '@/lib/util';
import { fmtDate, t } from '@/lib/i18n';
import { Page, toast } from '@/ui/overlay';
import { Block, BTag, Btn, LinkBtn, Title, Txt, useC, tap } from '@/ui/kit';
import { Icon } from '@/ui/Icon';

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
const trialEnd = () => { const d = new Date(); d.setDate(d.getDate() + 7); return fmtDate(d, { month: 'long', day: 'numeric', year: 'numeric' }); };

export default function Paywall() {
  const S = useStore(); const c = useC(); const { pack } = useLocalSearchParams<{ pack?: string }>();
  const [plan, setPlan] = useState<'year' | 'month'>('year'); const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | 'plus' | 'pack'>(null);
  const PK = pack ? PACK[pack] : null; const P = PLANS[plan];
  const buy = async () => {
    setBusy(true); await wait(1200);
    if (PK) mutate(s => { s.packs.owned[PK.id] = { at: Date.now(), test: true }; });
    else mutate(s => { s.plus = { plan, at: Date.now(), test: true, id: 'test_' + Date.now().toString(36) }; });
    setBusy(false); setDone(PK ? 'pack' : 'plus');
  };
  if (done || (S.plus && !PK)) {
    const owned = !done; const k = done === 'pack' && PK ? PK.k : 'grove';
    return (
      <Page title="" back={false}>
        <Block k={k} v={2} radius={36} style={{ minHeight: 440, padding: 22, paddingBottom: 26 }} art={{ size: 440, right: -150, top: -140 }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" color="#17101F" size={26} stroke={2.6} /></View>
          <View style={{ marginTop: 'auto', paddingTop: 120 }}>
            {done === 'pack' && PK ? <><Title a="Pack" b="unlocked." color={CT[k].t} /><Txt size={15.5} color={CT[k].t} tr={false} style={{ marginTop: 10, opacity: 0.85 }}>{t('All 7 days of') + ' ' + t(PK.title) + ' ' + t('are ready, with a journal prompt for each one.')}</Txt></>
              : <><Title a={owned ? 'You’re on' : 'You’re all'} b={owned ? 'Selah Plus.' : 'set.'} color={CT[k].t} />
                <Txt size={15.5} color={CT[k].t} tr={false} style={{ marginTop: 10, opacity: 0.85 }}>{(owned ? t('Plan:') + ' ' + t((PLANS[S.plus.plan] || { name: 'Plus' }).name) + (S.plus.test ? ' (' + t('test purchase') + ')' : '') + '.' : (plan === 'year' ? t('Your free trial runs until') + ' ' + trialEnd() + '.' : t('Selah Plus Monthly is now active.'))) + ' ' + t('Thank you for supporting Selah.')}</Txt></>}
          </View>
        </Block>
        <Btn kind="primary" block style={{ marginTop: 18 }} label={done === 'pack' ? 'Start day 1' : owned ? 'Done' : 'Start exploring'} onPress={() => { router.back(); if (done === 'pack' && PK) setTimeout(() => router.push({ pathname: '/day', params: { p: PK.id, d: '1' } }), 50); }} />
        {owned && S.plus && S.plus.test ? <LinkBtn label="Remove test purchase" color={c.ink} style={{ alignSelf: 'center', marginTop: 16 }} onPress={() => { mutate(s => { s.plus = null; }); toast('Test purchase removed'); router.back(); }} /> : null}
      </Page>
    );
  }
  if (PK) return (
    <Page title="Checkout" back={false} right={<View style={{ backgroundColor: '#F4F01E', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 }}><Txt w={700} size={12.5} color="#17101F">Test mode</Txt></View>}>
      <Block k={PK.k} v={1} radius={28} style={{ padding: 18 }} art={{ size: 300, right: -120, top: -130 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Txt w={700} size={17} tr={false}>{t(PK.title)}</Txt><Txt w={700} size={17} tr={false}>{money(PK.price)}</Txt></View>
        <Txt size={14.5} style={{ marginTop: 6, opacity: 0.85 }}>One-time purchase. All 7 days and journal prompts are yours to keep.</Txt>
        <Pressable onPress={() => router.setParams({ pack: '' })} style={{ marginTop: 12 }}><Txt w={700} size={14} style={{ textDecorationLine: 'underline' }}>Get every pack with Selah Plus</Txt></Pressable>
      </Block>
      <Txt muted size={14} style={{ marginTop: 18 }}>In the store version, payment is handled by Google Play or the App Store. Selah never sees your card.</Txt>
      <Btn kind="primary" block icon="lock" style={{ marginTop: 18 }} busy={busy} label={t('Pay') + ' ' + money(PK.price)} tr={false} onPress={buy} />
    </Page>
  );
  const Perk = ({ k, icon, title, sub }: { k: keyof typeof CT; icon: string; title: string; sub: string }) => (
    <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
      <View style={{ width: 46, height: 46, borderRadius: 16, backgroundColor: CT[k].bg, alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} color={CT[k].t} /></View>
      <View style={{ flex: 1 }}><Txt w={700}>{title}</Txt><Txt muted size={14}>{sub}</Txt></View>
    </View>);
  return (
    <Page title="" back={false} right={<LinkBtn label="Restore purchase" onPress={async () => { await wait(800); toast('No previous purchase found for this account'); }} />}>
      <Block k="night" v={3} photo="night" radius={36} style={{ minHeight: 300, padding: 22, paddingBottom: 26 }}>
        <BTag label="Selah Plus" />
        <View style={{ marginTop: 'auto', paddingTop: 120 }}><Title a="Go deeper" b="every day." color="#fff" /><Txt size={15.5} color="rgba(255,255,255,0.9)" style={{ marginTop: 10 }}>Personal affirmations, restful audio and guided packs, on top of everything that’s already free.</Txt></View>
      </Block>
      <View style={{ gap: 16, marginVertical: 22 }}>
        <Perk k="dusk" icon="spark" title="Unlimited Guide affirmations" sub="Personal affirmations for whatever you’re carrying today." />
        <Perk k="night" icon="moon" title="Every Sleep Scape" sub="Ocean, hymn pad, deep rest, and your own uploaded audio." />
        <Perk k="dawn" icon="book" title="All affirmation packs included" sub="Every 7-day pack and journal, now and as new ones arrive." />
        <Perk k="day" icon="layers" title="Home and lock-screen widgets" sub="Fresh affirmations on your phone all day." />
      </View>
      <View style={{ gap: 10 }}>{(Object.entries(PLANS) as [('year' | 'month'), any][]).map(([id, p]) => { const on = plan === id; return (
        <Pressable key={id} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => { tap(); setPlan(id); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 24, backgroundColor: c.surface, borderWidth: 2, borderColor: on ? c.accent : 'transparent' }}>
          <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: on ? c.accent : c.line, alignItems: 'center', justifyContent: 'center' }}>{on ? <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c.accent }} /> : null}</View>
          <View style={{ flex: 1 }}><Txt w={700}>{p.name}</Txt><Txt muted size={13.5}>{p.note}</Txt></View>
          <View style={{ alignItems: 'flex-end' }}><Txt w={700} tr={false}>{money(p.price)}</Txt><Txt muted size={12.5}>{'per ' + p.per}</Txt></View>
          {p.badge ? <View style={{ position: 'absolute', top: -10, right: 16, backgroundColor: '#F4F01E', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 }}><Txt w={700} size={11.5} color="#17101F">{p.badge}</Txt></View> : null}
        </Pressable>); })}</View>
      <Btn kind="primary" block style={{ marginTop: 20 }} busy={busy} label={plan === 'year' ? 'Start 7-day free trial' : 'Continue with ' + P.name} onPress={buy} />
      <Txt muted size={13} center lh={1.5} style={{ marginTop: 12 }} tr={false}>{(plan === 'year' ? t('Free until') + ' ' + trialEnd() + ', ' + t('then') + ' ' + money(P.price) + ' ' + t('a year. Cancel anytime before then and you won’t be charged.') : money(P.price) + ' ' + t('a month. Cancel anytime.')) + '\n' + t('Daily affirmations, the Bible and your goals are always free.')}</Txt>
    </Page>
  );
}
