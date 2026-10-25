/* Sound: Sleep Scapes (pre-rendered loops of the web app's generated sounds),
   the user's own audio, the reminder chime, and read-aloud affirmations. */
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import { S, mutate } from './store';
import { SCAPES, SCP } from './content';
import { ALL, refLabel } from './bible';
import { dateKey, pad } from './util';
import { LOC, t } from './i18n';
import { myTrack, setTrackDur } from './tracks';

const FILES: Record<string, number> = {
  rain: require('../../assets/audio/rain.m4a'),
  ocean: require('../../assets/audio/ocean.m4a'),
  hymn: require('../../assets/audio/hymn.m4a'),
  deep: require('../../assets/audio/deep.m4a'),
};
const CHIME = require('../../assets/audio/chime.m4a');

type Snd = { playing: boolean; cur: string | null; end: number; line: string; session: boolean; medStart: number | null; onEnded: (() => void) | null; paused: boolean };
export const SND: Snd = { playing: false, cur: null, end: 0, line: '', session: false, medStart: null, onEnded: null, paused: false };
let player: AudioPlayer | null = null, fadeT: any = null, tickT: any = null, voiceT: any = null, statusSub: any = null, ducked = false;
const subs = new Set<() => void>();
export const onSound = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
const emit = () => subs.forEach(f => f());
let modeSet = false;
async function mode() { if (modeSet) return; modeSet = true; try { await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true } as any); } catch (e) { } }

export function scapeInfo(id: string) {
  if (String(id).startsWith('u:')) { const tr = myTrack(id); return tr ? { id, n: tr.name, s: t('Your audio'), k: 'grove' as const, user: true, free: false } : { ...SCAPES[0], user: false }; }
  return { ...(SCP[id] || SCAPES[0]), user: false };
}
const targetVol = () => (ducked ? S.scape.vol * 0.3 : S.scape.vol);
function fadeTo(p: AudioPlayer, to: number, ms: number, done?: () => void) {
  clearInterval(fadeT); const from = p.volume ?? 0, steps = Math.max(1, Math.round(ms / 50)); let i = 0;
  fadeT = setInterval(() => { i++; try { p.volume = from + (to - from) * (i / steps); } catch (e) { } if (i >= steps) { clearInterval(fadeT); done && done(); } }, 50);
}
export async function playScape(id: string, opts: { session?: boolean; keepSpeech?: boolean } = {}) {
  stopScape(true, opts.keepSpeech); await mode();
  let src: any = null, loop = true;
  if (String(id).startsWith('u:')) { const tr = myTrack(id); if (!tr) return; src = { uri: tr.uri }; loop = !SND.onEnded; }
  else src = FILES[id] || FILES.rain;
  try {
    const p = createAudioPlayer(src); player = p; p.loop = loop; p.volume = 0; p.play();
    statusSub = p.addListener('playbackStatusUpdate', (st: any) => {
      if (st && st.duration && String(id).startsWith('u:')) setTrackDur(id.slice(2), st.duration);
      if (st && st.didJustFinish && !p.loop) { const f = SND.onEnded; f && f(); }
    });
    fadeTo(p, targetVol(), 900);
  } catch (e) { return; }
  SND.session = !!opts.session; SND.cur = id; SND.playing = true; SND.paused = false;
  if (!opts.session) { mutate(s => { s.scape.id = id; }); SND.medStart = Date.now(); }
  SND.end = opts.session ? 0 : (S.scape.timer ? Date.now() + S.scape.timer * 60000 : 0);
  if (!opts.session) startVoice();
  clearInterval(tickT); tickT = setInterval(tick, 1000); emit();
}
export function stopScape(quick?: boolean, keepSpeech?: boolean) {
  clearInterval(tickT); clearTimeout(voiceT); if (!keepSpeech) { try { Speech.stop(); } catch (e) { } }
  if (SND.medStart) { const k = dateKey(new Date()), secs = Math.round((Date.now() - SND.medStart) / 1000); SND.medStart = null; mutate(s => { s.med[k] = (s.med[k] || 0) + secs; }); }
  const p = player; player = null; try { statusSub && statusSub.remove(); } catch (e) { } statusSub = null;
  if (p) { const end = () => { try { p.pause(); p.remove(); } catch (e) { } }; if (quick) end(); else fadeTo(p, 0, 1500, end); }
  SND.playing = false; SND.line = ''; SND.paused = false; emit();
}
export function setVolume(v: number) { mutate(s => { s.scape.vol = v; }, { quiet: true }); if (player) try { player.volume = targetVol(); } catch (e) { } }
export function duck(on: boolean) { ducked = on; if (player) fadeTo(player, targetVol(), 400); }
export function pausePlayer(paused: boolean) { if (!player) return; try { paused ? player.pause() : player.play(); } catch (e) { } SND.paused = paused; emit(); }
export function playerPos() { if (!player) return { cur: 0, dur: 0 }; return { cur: player.currentTime || 0, dur: player.duration || 0 }; }
export function seek(sec: number) { if (player) try { player.seekTo(sec); } catch (e) { } }
export const userAudioActive = () => !!SND.cur && SND.cur.startsWith('u:');
function tick() { if (SND.end && Date.now() >= SND.end) { stopScape(); toastHook && toastHook('Sleep timer ended. Rest well.'); return; } emit(); }
export function setTimerMin(m: number) { mutate(s => { s.scape.timer = m; }); if (SND.playing && !SND.session) SND.end = m ? Date.now() + m * 60000 : 0; emit(); }

/* read-aloud */
export const speechLang = () => LOC();
export function speak(text: string, o: { rate?: number; onStart?: () => void; onDone?: () => void } = {}) {
  try { Speech.speak(text, { language: speechLang(), rate: o.rate ?? 0.85, pitch: 0.95, onStart: o.onStart, onDone: o.onDone, onStopped: o.onDone, onError: o.onDone as any }); } catch (e) { o.onDone && o.onDone(); }
}
export function stopSpeech() { try { Speech.stop(); } catch (e) { } }
export function startVoice() {
  clearTimeout(voiceT); SND.line = '';
  if (!S.scape.voice) return;
  const say = () => { if (!SND.playing) return; const it = ALL[Math.floor(Math.random() * ALL.length)]; SND.line = t(it.a) + ' (' + t(refLabel(it.r)) + ')'; speak(t(it.a), { rate: 0.8 }); emit(); voiceT = setTimeout(say, 40000); };
  voiceT = setTimeout(say, 3500);
}
export function setVoice(on: boolean) { mutate(s => { s.scape.voice = on; }); if (SND.playing) { if (on) startVoice(); else { clearTimeout(voiceT); stopSpeech(); SND.line = ''; emit(); } } }
export function leftLabel() { if (!SND.playing) return S.scape.timer ? t(`Stops after ${S.scape.timer} min`) : t('Plays until you stop it'); if (!SND.end) return t('Playing, no timer'); const s = Math.max(0, Math.round((SND.end - Date.now()) / 1000)); return t(Math.floor(s / 60) + ':' + pad(s % 60) + ' left'); }

/* reminder chime */
export async function chime() {
  if (!S.settings.sound) return; await mode();
  try { const p = createAudioPlayer(CHIME); p.volume = 0.9; p.play(); setTimeout(() => { try { p.remove(); } catch (e) { } }, 3000); } catch (e) { }
}
let toastHook: ((m: string) => void) | null = null;
export const setSoundToast = (f: (m: string) => void) => { toastHook = f; };
