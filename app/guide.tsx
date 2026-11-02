import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useStore, mutate } from '@/lib/store';
import { MOODS } from '@/lib/content';
import { parseRef, passage } from '@/lib/bible';
import { guideGenerate, guideLeft, isPlus, shareTextFor, themeColor, toggleSaved } from '@/lib/affirm';
import { dateKey, hash } from '@/lib/util';
import { refShow, t } from '@/lib/i18n';
import { openRef } from '@/screens/bibleNav';
import { openCard, shareText } from '@/lib/share';
import { Page, toast } from '@/ui/overlay';
import { Btn, Chip, Chips, Field, Input, Title, Txt, useC } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { AffCard } from '@/features/blocks';
import { Act } from '@/features/goals';
import { phTheme } from '@/lib/content';

export default function Guide() {
  const S = useStore(); const c = useC(); const sv = useRef<ScrollView>(null);
  const [mood, setMood] = useState(''); const [text, setText] = useState(''); const [busy, setBusy] = useState(false); const [res, setRes] = useState<any>(null); const [resY, setResY] = useState(0);
  const left = guideLeft();
  const go = async () => {
    if (!mood && !text.trim()) { toast('Pick a feeling or tell the Guide what’s on your mind'); return; }
    if (left <= 0) { router.push('/paywall'); toast('Unlimited Guide affirmations come with Selah Plus'); return; }
    setBusy(true); await new Promise(r => setTimeout(r, 1200));
    const r = guideGenerate(mood, text.trim()); setBusy(false); setRes(r);
    mutate(s => { s.guide.unshift(r); s.guide = s.guide.slice(0, 30); const k = dateKey(new Date()); s.guideUse = { [k]: (s.guideUse[k] || 0) + 1 }; });
    setTimeout(() => sv.current && sv.current.scrollTo({ y: resY, animated: true }), 200);
  };
  const rr = res ? parseRef(res.ref) : null, saved = res ? S.saved.some(s => s.id === res.id) : false;
  return (
    <Page title="Your guide" back={false} scrollRef={sv} right={<View style={{ backgroundColor: '#F4F01E', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 }}><Txt w={700} size={12.5} color="#17101F">Preview</Txt></View>}>
      <Title a="How is your" b="heart today?" style={{ marginTop: 6, marginBottom: 20 }} />
      <Txt w={600} size={14} style={{ marginBottom: 10 }}>I’m feeling</Txt>
      <Chips style={{ marginBottom: 20 }}>{Object.keys(MOODS).map(m => <Chip key={m} label={m} on={mood === m} onPress={() => setMood(mood === m ? '' : m)} />)}</Chips>
      <Field label="What’s on your mind? (optional)"><Input multi value={text} onChangeText={setText} maxLength={400} placeholder="For example: my interview is tomorrow and I can’t stop worrying." /></Field>
      <Btn kind="primary" block busy={busy} icon={busy ? undefined : 'spark'} label={busy ? 'Finding words for you…' : res ? 'Write another' : 'Write my affirmation'} onPress={go} />
      <Txt muted size={13.5} center style={{ marginTop: 12 }}>{isPlus() ? 'Unlimited with Selah Plus.' : left ? '1 free affirmation a day. Unlimited with Plus.' : 'You’ve used today’s free affirmation. Come back tomorrow, or go unlimited with Plus.'}</Txt>
      {res ? <View onLayout={e => setResY(e.nativeEvent.layout.y)} style={{ marginTop: 24 }}>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 14, borderRadius: 20, backgroundColor: c.surface, marginBottom: 14 }}><Icon name="spark" size={20} color={c.accent} /><Txt size={15} style={{ flex: 1 }}>{res.note}</Txt></View>
        <AffCard k={themeColor(res.theme)} v={hash(res.id)} photo={phTheme(res.theme, hash(res.id))} seed={hash(res.id)} tag={res.mood || res.theme} onGo={() => { router.back(); openRef(res.ref); }} aff={t(res.a)} verse={rr ? passage(rr) : ''} refText={refShow(res.ref)} />
        <View style={{ flexDirection: 'row', gap: 4, marginTop: 16 }}>
          <Act icon="heart" label={saved ? 'Saved' : 'Save'} on={saved} onPress={() => { const on = toggleSaved({ id: res.id, a: res.a, ref: res.ref }); toast(on ? 'Saved' : 'Removed from Saved'); }} />
          <Act icon="share" label="Share" onPress={() => shareText(shareTextFor(t(res.a), rr ? passage(rr) : '', res.ref))} />
          <Act icon="image" label="Card" onPress={() => openCard({ aff: t(res.a), text: rr ? passage(rr) : '', ref: res.ref, label: t(res.mood || res.theme), key: themeColor(res.theme), v: hash(res.id) })} />
        </View>
      </View> : null}
      {S.guide.length > (res ? 1 : 0) ? <>
        <Txt w={700} size={21} style={{ marginTop: 30, marginBottom: 12 }}>Recent</Txt>
        {S.guide.filter((g: any) => !res || g.id !== res.id).slice(0, 5).map((g: any) => (
          <Pressable key={g.id} onPress={() => setRes(g)} style={{ backgroundColor: c.surface, borderRadius: 22, padding: 16, marginBottom: 10 }}>
            <Txt w={600} size={16} lh={1.4}>{g.a}</Txt>
            <Txt muted size={13.5} tr={false} style={{ marginTop: 4 }}>{refShow(g.ref) + (g.mood ? ', ' + t('feeling') + ' ' + t(g.mood).toLowerCase() : '')}</Txt>
          </Pressable>))}
      </> : null}
    </Page>
  );
}
