/* The live prayer session: scripture read aloud on a timer, a music playlist
   with repeat modes, a target time with a chime, and the log afterwards. */
import { router } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { S, mutate } from '../lib/store';
import { SEG, URV } from '../lib/content';
import { parseRef, passage } from '../lib/bible';
import { t, locRefs } from '../lib/i18n';
import { SND, chime, duck, pausePlayer, playScape, playerPos, seek, speak, stopScape, stopSpeech } from '../lib/sound';
import { myTracks } from '../lib/tracks';
import { urItem, urVerses } from '../lib/ur';
import { toast } from '../ui/overlay';

export type Run = { kind: string; refId: string | null; name: string; start: number; verses: string[]; vi: number; scrOn: boolean; every: number; playlist: { t: string; id: string }[]; pi: number; musicOn: boolean; paused: boolean; target: number; cur: { ref: string; text: string } | null; chimed: boolean };
export const UR: { run: Run | null; segStart: number; pauseAt: number; after: any } = { run: null, segStart: 0, pauseAt: 0, after: null };
let vT: any = null, plT: any = null;
const subs = new Set<() => void>();
export const onRun = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
const emit = () => subs.forEach(f => f());

export function startPrayer(kind: string, id?: string | null) {
  if (UR.run) endPrayer(true);
  const src = id ? urItem(kind, id) : null;
  const x = src || { name: t('Open prayer'), themes: ['Worship', 'Peace'], custom: [], scrOn: true, every: 2, playlist: [{ t: 'scape', id: 'hymn' }], target: 0 };
  const vs = urVerses(x);
  const mine = myTracks();
  UR.run = { kind: src ? kind : 'session', refId: src ? src.id : null, name: x.name, start: Date.now(), verses: vs.length ? vs : URV.Worship, vi: 0, scrOn: x.scrOn !== false && !!vs.length, every: x.every || 2,
    playlist: (x.playlist || []).filter((it: any) => it.t === 'scape' || mine.some(m => m.id === it.id)), pi: 0, musicOn: true, paused: false, target: (kind === 'watch' && src ? src.dur : x.target) || 0, cur: null, chimed: false };
  activateKeepAwakeAsync('prayer').catch(() => {});
  router.push('/ur/run');
  urMusic(0); urScripture(true);
}
const loopThis = (r: Run) => S.ur.repeat === 'one' || (r.playlist.length === 1 && S.ur.repeat === 'all');
export function urMusic(i: number) {
  const r = UR.run; if (!r) return; clearTimeout(plT);
  if (!r.playlist.length) { SND.onEnded = null; emit(); return; }
  r.pi = ((i % r.playlist.length) + r.playlist.length) % r.playlist.length; r.musicOn = true; r.paused = false;
  const it = r.playlist[r.pi], lp = loopThis(r);
  SND.onEnded = lp ? null : urAdvance;
  playScape(it.t === 'scape' ? it.id : 'u:' + it.id, { session: true, keepSpeech: true });
  UR.segStart = Date.now();
  if (it.t === 'scape' && !lp) plT = setTimeout(urAdvance, SEG * 1000);
  emit();
}
function urAdvance() {
  const r = UR.run; if (!r) return; let n = r.pi + 1;
  if (n >= r.playlist.length) { if (S.ur.repeat === 'all') n = 0; else { r.musicOn = false; r.paused = false; SND.onEnded = null; clearTimeout(plT); if (SND.playing) stopScape(true, true); emit(); toast('Playlist finished'); return; } }
  urMusic(n);
}
export function urPauseToggle() {
  const r = UR.run; if (!r || !r.playlist.length) return;
  if (!r.musicOn) { urMusic(r.pi); return; }
  const it = r.playlist[r.pi];
  if (it.t === 'my') { pausePlayer(!r.paused); r.paused = !r.paused; }
  else if (r.paused) { const left = Math.max(0, SEG * 1000 - (UR.pauseAt - UR.segStart)); UR.segStart = Date.now() - (SEG * 1000 - left); playScape(it.id, { session: true, keepSpeech: true }); if (!loopThis(r)) plT = setTimeout(urAdvance, left); r.paused = false; }
  else { UR.pauseAt = Date.now(); clearTimeout(plT); stopScape(true, true); r.paused = true; }
  emit();
}
export function urPrev() { const r = UR.run; if (!r || !r.playlist.length) return; const p = playerPos(); if (r.playlist[r.pi].t === 'my' && p.cur > 3 && !r.paused) { seek(0); return; } urMusic(r.pi - 1); }
export function urNext() { const r = UR.run; if (!r) return; urMusic(r.pi + 1); }
export function urSkip(sec: number) { const p = playerPos(); if (p.dur) seek(Math.max(0, Math.min(p.dur - 0.5, p.cur + sec))); }
export function urRepeatCycle() {
  const order = ['all', 'one', 'off']; mutate(s => { s.ur.repeat = order[(order.indexOf(s.ur.repeat) + 1) % 3]; }); const r = UR.run;
  if (r && r.musicOn && r.playlist.length) { const it = r.playlist[r.pi], lp = loopThis(r); SND.onEnded = lp ? null : urAdvance; clearTimeout(plT); if (it.t === 'scape' && !lp && !r.paused) plT = setTimeout(urAdvance, Math.max(0, SEG * 1000 - (Date.now() - UR.segStart))); }
  emit(); toast(S.ur.repeat === 'all' ? 'Repeat playlist' : S.ur.repeat === 'one' ? 'Repeat this track' : 'Repeat off');
}
export function trackPos() {
  const r = UR.run; if (!r || !r.playlist.length || !r.musicOn) return null; const it = r.playlist[r.pi];
  if (it.t === 'my') { const p = playerPos(); return { cur: p.cur, dur: p.dur, live: false }; }
  if (loopThis(r)) return { cur: ((r.paused ? UR.pauseAt : Date.now()) - UR.segStart) / 1000, dur: 0, live: true };
  return { cur: Math.min(SEG, ((r.paused ? UR.pauseAt : Date.now()) - UR.segStart) / 1000), dur: SEG, live: false };
}
export function urSeekTo(frac: number) { const r = UR.run, p = trackPos(); if (!r || !p || !p.dur) return; const tt = frac * p.dur;
  if (r.playlist[r.pi].t === 'my') seek(tt); else { UR.segStart = Date.now() - tt * 1000; if (r.paused) UR.pauseAt = Date.now(); clearTimeout(plT); if (!r.paused) plT = setTimeout(urAdvance, Math.max(0, (SEG - tt) * 1000)); } emit(); }
export function urScripture(first: boolean) {
  const r = UR.run; if (!r) return; clearTimeout(vT);
  const say = () => { if (!UR.run) return; const ref = r.verses[r.vi % r.verses.length], p = parseRef(ref); r.cur = { ref, text: p ? passage(p) : '' }; r.vi++; emit();
    if (r.scrOn) { stopSpeech(); const spoken = locRefs(ref).replace(/:/, ' ' + t('chapter') + ' ').replace(/(\d)-(\d)/, '$1 ' + t('to') + ' $2') + '. ' + r.cur.text; speak(spoken, { rate: 0.86, onStart: () => duck(true), onDone: () => duck(false) }); }
    vT = setTimeout(say, r.every * 60000); };
  vT = setTimeout(say, first ? 2500 : 0);
}
export function urToggleScripture() { const r = UR.run; if (!r) return; r.scrOn = !r.scrOn; if (!r.scrOn) { stopSpeech(); duck(false); } else urScripture(false); emit(); toast(r.scrOn ? 'Scripture playback on' : 'Scripture playback off'); }
export function urTick() { const r = UR.run; if (!r) return; const s = (Date.now() - r.start) / 1000; if (r.target && !r.chimed && s >= r.target * 60) { r.chimed = true; chime(); } }
/* end the prayer and log it; returns the log entry */
export function endPrayer(silent?: boolean) {
  const r = UR.run; if (!r) return null; UR.run = null;
  clearTimeout(vT); clearTimeout(plT); SND.onEnded = null; stopSpeech(); if (SND.playing) stopScape(); deactivateKeepAwake('prayer');
  const secs = Math.round((Date.now() - r.start) / 1000);
  const log = { id: 'l' + Date.now().toString(36), kind: r.kind, refId: r.refId, name: r.name, start: r.start, secs, silence: 0, heard: '', at: Date.now() };
  mutate(s => { s.ur.logs.unshift(log); });
  emit(); if (silent) return null;
  return log;
}
