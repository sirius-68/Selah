/* "Your sounds": audio files the user adds, kept in the app's own folder. */
import { Platform } from 'react-native';
import * as FS from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { kvGet, kvSet, poke } from './store';

export type Track = { id: string; name: string; size: number; dur: number; at: number; uri: string };
const KEY = 'selah.tracks';
export const MY = { max: 20, maxMB: 60 };
export const myTracks = (): Track[] => kvGet<Track[]>(KEY, []);
const setTracks = (l: Track[]) => { kvSet(KEY, l); poke(); };
export const myTrack = (id: string) => myTracks().find(x => 'u:' + x.id === id || x.id === id);
const dir = () => (FS.documentDirectory || '') + 'tracks/';

export async function pickTracks(): Promise<{ ids: string[]; msgs: string[] }> {
  const msgs: string[] = [], ids: string[] = [];
  const res = await DocumentPicker.getDocumentAsync({ type: 'audio/*', multiple: true, copyToCacheDirectory: true });
  if (res.canceled) return { ids, msgs };
  if (Platform.OS !== 'web') { try { await FS.makeDirectoryAsync(dir(), { intermediates: true }); } catch (e) { } }
  let list = myTracks().slice();
  for (const f of res.assets) {
    if (list.length >= MY.max) { msgs.push(`You can keep up to ${MY.max} sounds. Remove one to add more.`); break; }
    if ((f.size || 0) > MY.maxMB * 1048576) { msgs.push(`${f.name} is over ${MY.maxMB} MB. Try a shorter or compressed file.`); continue; }
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    let uri = f.uri;
    if (Platform.OS !== 'web') { const ext = (f.name.match(/\.[a-z0-9]+$/i) || ['.m4a'])[0]; uri = dir() + id + ext; try { await FS.copyAsync({ from: f.uri, to: uri }); } catch (e) { msgs.push('Your device is out of space for audio. Remove a sound and try again.'); break; } }
    const name = f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim().slice(0, 60).replace(/^./, c => c.toUpperCase()) || 'My sound';
    list = [{ id, name, size: f.size || 0, dur: 0, at: Date.now(), uri }, ...list]; ids.push(id);
  }
  setTracks(list);
  return { ids, msgs };
}
export async function removeTrack(id: string) { const tr = myTracks().find(x => x.id === id); if (tr && Platform.OS !== 'web') { try { await FS.deleteAsync(tr.uri, { idempotent: true }); } catch (e) { } } setTracks(myTracks().filter(x => x.id !== id)); }
export function renameTrack(id: string, name: string) { setTracks(myTracks().map(x => x.id === id ? { ...x, name } : x)); }
export function setTrackDur(id: string, dur: number) { const l = myTracks(); const x = l.find(y => y.id === id); if (x && dur && Math.abs((x.dur || 0) - dur) > 1) { x.dur = dur; setTracks(l.slice()); } }
