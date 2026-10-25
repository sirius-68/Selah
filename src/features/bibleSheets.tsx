/* Sheets used from the Bible and Saved: verse notes and "make it your affirmation". */
import React, { useState } from 'react';
import { View } from 'react-native';
import { S, mutate } from '../lib/store';
import { keyParts, passage, refLabel, verseRefOf } from '../lib/bible';
import { refShow, t } from '../lib/i18n';
import { Btn, Field, Input, Txt, useC } from '../ui/kit';
import { closeSheet, openSheet, SheetTitle, toast } from '../ui/overlay';

export function Prev({ text, refText }: { text: string; refText?: string }) {
  const c = useC();
  return <View style={{ borderRadius: 18, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: c.surface2, marginBottom: 16 }}>
    <Txt size={16} lh={1.7} tr={false} serif={S.settings.read === 'serif'}>{'“' + text + '”'}</Txt>
    {refText ? <Txt w={700} size={14} tr={false} style={{ marginTop: 4 }}>{refText}</Txt> : null}
  </View>;
}

export function openNote(k: string, v2?: number, after?: () => void) { openSheet(<NoteSheet k={k} v2={v2} after={after} />); }
function NoteSheet({ k, v2, after }: { k: string; v2?: number; after?: () => void }) {
  const n = S.notes[k], r = { ...verseRefOf(k), v2: (n && n.to) || v2 || keyParts(k).v };
  const [tx, setTx] = useState(n ? n.t : '');
  return (
    <View>
      <SheetTitle>{t('Note on') + ' ' + refShow(refLabel(r)).replace(/ \S+$/, '')}</SheetTitle>
      <Prev text={passage(r)} />
      <Field label="Your note"><Input multi value={tx} onChangeText={setTx} placeholder="What is God showing you here?" autoFocus /></Field>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {n ? <Btn kind="danger" label="Delete" style={{ flex: 1 }} onPress={() => { mutate(s => { delete s.notes[k]; }); closeSheet(); toast('Note deleted'); after && after(); }} /> : null}
        <Btn kind="primary" label="Save note" style={{ flex: 1 }} onPress={() => { const v = tx.trim(); mutate(s => { if (!v) delete s.notes[k]; else s.notes[k] = { t: v, to: r.v2 > keyParts(k).v ? r.v2 : 0, at: Date.now() }; }); closeSheet(); toast('Note saved'); after && after(); }} />
      </View>
    </View>
  );
}

export function openAffirm(ref: string, text: string, after?: () => void) { openSheet(<AffirmSheet refL={ref} text={text} after={after} />); }
function AffirmSheet({ refL, text, after }: { refL: string; text: string; after?: () => void }) {
  const [tx, setTx] = useState('');
  return (
    <View>
      <SheetTitle>Make it your affirmation</SheetTitle>
      <Prev text={text} refText={refShow(refL)} />
      <Field label="Say it in your own words"><Input multi value={tx} onChangeText={setTx} placeholder="I am… / I walk in… / God is…" autoFocus /></Field>
      <Txt muted size={14} style={{ marginTop: -6, marginBottom: 18 }}>Start with “I” or “God” so it reads as something you can say aloud.</Txt>
      <Btn kind="primary" label="Save affirmation" onPress={() => { const v = tx.trim(); if (!v) { toast('Write your affirmation first'); return; } mutate(s => { s.saved.push({ id: refL + '|' + v, a: v, ref: refL, text, at: Date.now(), custom: true }); }); closeSheet(); toast('Saved to your affirmations'); after && after(); }} />
    </View>
  );
}
