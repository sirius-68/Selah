/* Share card studio: colour or photo backgrounds (including your own photo),
   rendered natively and exported as a 1080 × 1350 PNG. */
import React, { useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import Svg, { Defs, LinearGradient, Rect, Stop, Path } from 'react-native-svg';
import { CARD, shareText } from '@/lib/share';
import { CARD_BG, CT, CT_KEYS, ThemeKey, phUrl } from '@/lib/content';
import { cardKey, shareTextFor } from '@/lib/affirm';
import { hash, slug } from '@/lib/util';
import { refShow, t } from '@/lib/i18n';
import { F } from '@/lib/theme';
import { Page, toast } from '@/ui/overlay';
import { Btn, SetRow, Switch, Txt, useC, tap } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { Ribbon } from '@/ui/Ribbon';
import { photoIds } from '@/ui/Photo';
import { suspendLock } from '@/features/lock';

const fit = (len: number, max: number, min: number, ref: number) => Math.max(min, Math.min(max, Math.round(max * Math.sqrt(ref / Math.max(1, len)))));

export default function CardStudio() {
  const c = useC(); const { width } = useWindowDimensions();
  const d = CARD || { text: '', ref: '' };
  const [key, setKey] = useState<ThemeKey>((d.key && (CT as any)[d.key]) ? d.key as ThemeKey : cardKey());
  const [showVerse, setShowVerse] = useState(true);
  const [bg, setBg] = useState<{ slot?: string; uri?: string } | null>(null);
  const shot = useRef<View>(null);
  const W = Math.min(width - 32, 360), s = W / 1080, H = 1350 * s;
  const T = CT[key], photo = !!bg, ink = photo ? '#fff' : T.t;
  const hasAff = !!d.aff, label = d.label || (hasAff ? t('Affirmation') : t('Scripture'));
  const main = hasAff ? d.aff! : '“' + d.text + '”';
  const ms = hasAff ? fit(main.length, 92, 48, showVerse ? 46 : 70) : fit(main.length, 66, 32, 150);
  const vs = fit(d.text.length, 40, 24, 180);
  const bgUri = bg ? (bg.uri || phUrl(photoIds(bg.slot!, 0)[0] || '', 1080)) : null;
  const capture = async () => { try { return await captureRef(shot, { format: 'png', quality: 1, width: 1080, height: 1350, result: 'tmpfile' }); } catch (e) { return null; } };
  const name = 'selah-' + slug(d.ref || 'card') + '.png';
  const pickPhoto = async () => {
    suspendLock();
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] as any, quality: 0.9, allowsEditing: true, aspect: [4, 5] });
    if (!r.canceled && r.assets && r.assets[0]) setBg({ uri: r.assets[0].uri });
  };
  return (
    <Page title="Share card" back={false}>
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <View ref={shot} collapsable={false} style={{ width: W, height: H, borderRadius: 26 * (W / 320), overflow: 'hidden', backgroundColor: photo ? '#1d1626' : T.bg }}>
          {photo && bgUri ? <>
            <Image source={{ uri: bgUri }} style={{ position: 'absolute', width: W, height: H }} contentFit="cover" />
            <Svg style={{ position: 'absolute' }} width={W} height={H} viewBox="0 0 10 10" preserveAspectRatio="none"><Defs><LinearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#0C0812" stopOpacity={0.35} /><Stop offset="0.35" stopColor="#0C0812" stopOpacity={0.05} /><Stop offset="0.6" stopColor="#0C0812" stopOpacity={0.45} /><Stop offset="1" stopColor="#0C0812" stopOpacity={0.88} /></LinearGradient></Defs><Rect x="0" y="0" width="10" height="10" fill="url(#cg)" /></Svg>
          </> : <Ribbon k={key} v={d.v ?? hash(d.ref || '')} size={1155 * s} fade={false} style={{ left: (1080 - 700 - 165) * s, top: (-260 - 165) * s }} />}
          <View style={{ position: 'absolute', left: 90 * s, top: 84 * s, height: 62 * s, paddingHorizontal: 28 * s, borderRadius: 31 * s, backgroundColor: photo ? 'rgba(255,255,255,0.2)' : T.t + '24', justifyContent: 'center' }}>
            <Txt w={600} size={30 * s} color={ink} tr={false}>{label}</Txt>
          </View>
          <View style={{ position: 'absolute', left: 90 * s, right: 90 * s, bottom: 190 * s }}>
            <Txt w={hasAff ? 700 : 600} size={ms * s} lh={hasAff ? 1.04 : 1.18} color={ink} tr={false} ls={hasAff ? -0.02 : 0}>{main}</Txt>
            {hasAff && showVerse && d.text ? <Txt size={vs * s} lh={1.36} color={ink} tr={false} style={{ marginTop: 36 * s, opacity: 0.86 }}>{'“' + d.text + '”'}</Txt> : null}
            <Txt w={700} size={34 * s} color={ink} tr={false} style={{ marginTop: 26 * s }}>{refShow(d.ref)}</Txt>
          </View>
          <Txt w={700} size={44 * s} color={ink} tr={false} style={{ position: 'absolute', left: 90 * s, bottom: 82 * s }}>Selah</Txt>
          <View style={{ position: 'absolute', right: 90 * s, bottom: 66 * s, width: 88 * s, height: 88 * s, borderRadius: 44 * s, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={40 * s} height={40 * s} viewBox="0 0 40 40"><Path d="M8 32 L32 8 M12 8 L32 8 L32 28" stroke="#17101F" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>
          </View>
        </View>
      </View>
      <Txt w={600} size={14} style={{ marginBottom: 8 }}>Colour</Txt>
      <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        {CT_KEYS.map(k => <Pressable key={k} accessibilityLabel={CT[k].n} onPress={() => { tap(); setKey(k); setBg(null); }} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: CT[k].bg, borderWidth: 3, borderColor: k === key && !bg ? c.ink : c.surface }} />)}
      </View>
      <Txt w={600} size={14} style={{ marginBottom: 8 }}>Background</Txt>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16, marginBottom: 18 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
        <Pressable onPress={pickPhoto} style={{ width: 64, height: 80, borderRadius: 16, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: bg && bg.uri ? 2.5 : 0, borderColor: c.ink }}>
          <Icon name="plus" color={c.ink} /><Txt w={600} size={11}>My photo</Txt>
        </Pressable>
        {CARD_BG.map(slot => { const id = photoIds(slot, 0)[0]; const on = !!bg && bg.slot === slot; return (
          <Pressable key={slot} onPress={() => { tap(); setBg({ slot }); }} style={{ width: 64, height: 80, borderRadius: 16, overflow: 'hidden', borderWidth: on ? 2.5 : 0, borderColor: c.ink }}>
            {id ? <Image source={{ uri: phUrl(id, 200) }} style={{ width: '100%', height: '100%' }} contentFit="cover" /> : null}
          </Pressable>); })}
      </ScrollView>
      {hasAff ? <SetRow title="Include the verse" right={<Switch value={showVerse} onChange={setShowVerse} a11y="Include the verse" />} /> : null}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Btn kind="primary" icon="download" label="Save" style={{ flex: 1 }} onPress={async () => {
          if (Platform.OS === 'web') { toast('Saving images works in the phone app'); return; }
          const uri = await capture(); if (!uri) { toast('Could not make the card'); return; }
          const p = await MediaLibrary.requestPermissionsAsync(true); if (!p.granted) { toast('Allow photo access to save cards'); return; }
          try { await MediaLibrary.saveToLibraryAsync(uri); toast('Card saved to your photos'); } catch (e) { toast('Could not save the card'); }
        }} />
        <Btn icon="share" label="Share" style={{ flex: 1 }} onPress={async () => {
          const txt = shareTextFor(d.aff, d.text, d.ref);
          if (Platform.OS === 'web' || !(await Sharing.isAvailableAsync())) { shareText(txt); return; }
          const uri = await capture(); if (!uri) { shareText(txt); return; }
          try { await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: name, UTI: 'public.png' }); } catch (e) { }
        }} />
      </View>
    </Page>
  );
}
