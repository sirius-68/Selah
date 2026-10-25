/* Supabase accounts and cloud sync, wire-compatible with the web app:
   same auth endpoints, same user_state row, same merge rules and the same
   end-to-end encryption format (AES-GCM, PBKDF2-SHA256 210k, "iv:ct" base64). */
import { AppState, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { gcm } from '@noble/ciphers/aes';
import { pbkdf2Async } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';
import { S, DEF, kvGet, kvGetAsync, kvSet, mutate, normalize, onSave, replaceState, save, flush } from './store';
import { SUPABASE } from './content';
import { b64ToBytes, bytesToB64, fromUtf8, isObj, utf8 } from './util';
import { t } from './i18n';
import { useVersion, currentVersion } from './bible';

const SYNC_SKIP = ['user', 'guest', 'intro', 'lock', 'fired', 'pos', 'plus', 'noticeHidden'];
const PRIV = ['rec', 'jn', 'journal', 'notes', 'ur'];
export const SB_ON = () => !!SUPABASE.key && !/^__/.test(SUPABASE.key);
export const redirectUrl = () => Linking.createURL('auth');

type Sess = { access_token: string; refresh_token: string; expires_at: number; user: any; from?: string } | null;
class HttpErr extends Error { status = 0; code = ''; }
export const SB = {
  sess: null as Sess, cfg: null as any, _ref: null as Promise<void> | null,
  load() { this.sess = kvGet<Sess>('selah.sb', null); },
  store(s: Sess) { this.sess = s; kvSet('selah.sb', s); },
  async req(path: string, { method = 'GET', body, auth = true, headers = {} }: { method?: string; body?: any; auth?: boolean; headers?: Record<string, string> } = {}) {
    const h: Record<string, string> = { apikey: SUPABASE.key, 'Content-Type': 'application/json', ...headers };
    if (auth && this.sess) await this.fresh();
    if (auth && this.sess) h.Authorization = 'Bearer ' + this.sess.access_token; // publishable keys go only in the apikey header
    let r: Response; try { r = await fetch(SUPABASE.url + path, { method, headers: h, body: body != null ? JSON.stringify(body) : undefined }); }
    catch (e) { const er = new HttpErr('network'); er.code = 'network'; throw er; }
    const txt = await r.text(); let j: any = null; try { j = txt ? JSON.parse(txt) : null; } catch (e) { }
    if (!r.ok) { const er = new HttpErr((j && (j.msg || j.error_description || j.message || j.error)) || ('HTTP ' + r.status)); er.status = r.status; er.code = (j && (j.error_code || j.code || j.error)) || ''; throw er; }
    return j;
  },
  setToken(j: any) { const s = { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: +j.expires_at || Math.floor(Date.now() / 1000) + (+j.expires_in || 3600), user: j.user || (this.sess && this.sess.user) || null }; this.store(s); return s; },
  async fresh() {
    const s = this.sess; if (!s || s.expires_at * 1000 - Date.now() > 60e3) return;
    if (this._ref) return this._ref;
    this._ref = (async () => { try { const j = await this.req('/auth/v1/token?grant_type=refresh_token', { method: 'POST', auth: false, body: { refresh_token: s.refresh_token } }); this.setToken(j); }
      catch (e: any) { if (e.status >= 400 && e.status < 500) { this.store(null); sbLost(); } throw e; } finally { this._ref = null; } })();
    return this._ref;
  },
  async settings() { if (this.cfg) return this.cfg; try { this.cfg = await this.req('/auth/v1/settings', { auth: false }); } catch (e) { this.cfg = { external: {} }; } return this.cfg; },
  async signIn(email: string, password: string) { const j = await this.req('/auth/v1/token?grant_type=password', { method: 'POST', auth: false, body: { email, password } }); return this.setToken(j); },
  async signUp(email: string, password: string, name: string) { const j = await this.req('/auth/v1/signup?redirect_to=' + encodeURIComponent(redirectUrl()), { method: 'POST', auth: false, body: { email, password, data: { name } } }); return j && j.access_token ? this.setToken(j) : null; },
  resend(email: string) { return this.req('/auth/v1/resend?redirect_to=' + encodeURIComponent(redirectUrl()), { method: 'POST', auth: false, body: { type: 'signup', email } }); },
  recover(email: string) { return this.req('/auth/v1/recover?redirect_to=' + encodeURIComponent(redirectUrl()), { method: 'POST', auth: false, body: { email } }); },
  async user() { const u = await this.req('/auth/v1/user'); if (this.sess) { this.sess.user = u; this.store(this.sess); } return u; },
  updateUser(b: any) { return this.req('/auth/v1/user', { method: 'PUT', body: b }); },
  async signOut() { try { if (this.sess) await this.req('/auth/v1/logout?scope=local', { method: 'POST' }); } catch (e) { } this.store(null); },
  uid(): string | null { return (this.sess && this.sess.user && this.sess.user.id) || null; },
  row(sel = '*') { return this.req(`/rest/v1/user_state?user_id=eq.${this.uid()}&select=${sel}`).then((r: any) => (r && r[0]) || null); },
  upsert(body: any) { return this.req('/rest/v1/user_state?on_conflict=user_id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body }).then((r: any) => (r && r[0]) || null); },
  delRow() { return this.req(`/rest/v1/user_state?user_id=eq.${this.uid()}`, { method: 'DELETE' }); },
  deleteAccount() { return this.req('/rest/v1/rpc/delete_my_account', { method: 'POST', body: {} }); },
};
export function sbUserToLocal(u: any) { const m = (u && u.user_metadata) || {}, p = (u && u.app_metadata && u.app_metadata.provider) || 'email'; return { id: u.id, name: m.name || m.full_name || '', email: u.email || '', provider: p === 'email' ? 'email' : p.charAt(0).toUpperCase() + p.slice(1), at: Date.now() }; }
export function sbErr(e: any) {
  const m = String((e && e.message) || ''), c = String((e && e.code) || '');
  if (c === 'network') return t('Can’t reach the server. Check your connection and try again.');
  if (/invalid.login|invalid_credentials/i.test(m + c)) return t('That email and password don’t match.');
  if (/not.confirmed/i.test(m + c)) return t('Confirm your email first. Check your inbox for the link.');
  if (/already.registered|user_already_exists/i.test(m + c)) return t('An account with this email already exists. Sign in instead.');
  if (/weak|password.should/i.test(m + c)) return t('Choose a stronger password, at least 8 characters.');
  if ((e && e.status === 429) || /rate/i.test(m + c)) return t('Too many tries. Wait a minute and try again.');
  if (/signup.*disabled/i.test(m + c)) return t('New sign-ups are turned off right now.');
  return m || t('Something went wrong. Try again.');
}
let notify: (m: string) => void = () => {};
let askLink: (() => void) | null = null, askUnlock: (() => void) | null = null, askNewPw: (() => void) | null = null;
export function syncUI(o: { toast: (m: string) => void; link: () => void; unlock: () => void; newPassword: () => void }) { notify = o.toast; askLink = o.link; askUnlock = o.unlock; askNewPw = o.newPassword; }
function sbLost() { if (!S.user) return; mutate(s => { s.user = null; }); notify(t('Please sign in again to keep syncing')); }

/* ---------- sync state ---------- */
type Meta = { uid?: string | null; rev?: string | null; dirty?: boolean; at?: number; e2e?: boolean; salt?: string | null; check?: string | null };
export const SY = { busy: false, state: 'idle', last: 0, key: null as Uint8Array | null, locked: false, asked: false, t: null as any };
export const syMetaGet = (): Meta => kvGet<Meta>('selah.sync', {});
function syMeta(p: Meta) { kvSet('selah.sync', Object.assign({}, syMetaGet(), p)); }
const subs = new Set<() => void>();
export const onSync = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
function syStatus(s: string) { SY.state = s; subs.forEach(f => f()); }
export function syLabel() {
  const s = SY.state, M = syMetaGet(); if (s === 'syncing') return t('Syncing…'); if (s === 'offline') return t('Offline. Changes will sync when you’re back online.');
  if (s === 'error') return t('Couldn’t sync. We’ll try again soon.'); if (s === 'setup') return t('Cloud sync needs a one-time setup in Supabase.');
  if (!M.at) return t('Not synced yet'); const m = Math.round((Date.now() - M.at) / 6e4);
  return m < 1 ? t('Synced just now') : t('Synced {n} min ago').replace('{n}', String(m));
}
function snapshot() { const d: any = {}; Object.keys(S).forEach(k => { if (!SYNC_SKIP.includes(k)) d[k] = (S as any)[k]; }); return JSON.parse(JSON.stringify(d)); }
function localHasData() { return !!(S.goals.length || S.saved.length || Object.keys(S.notes || {}).length || Object.keys(S.hl || {}).length || (S.rec && S.rec.trackers.length) || (S.jn && S.jn.notes.length) || (S.ur && S.ur.logs.length)); }
const stamp = (x: any) => +(x.updated || x.at || x.created || x.start || 0);
export function mergeDeep(a: any, b: any): any {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.concat(b).every(x => isObj(x) && x.id != null)) { const m = new Map(); a.forEach(x => m.set(x.id, x)); b.forEach(x => { const o = m.get(x.id); m.set(x.id, o && stamp(o) > stamp(x) ? o : x); }); return [...m.values()]; }
    if (a.concat(b).every(x => typeof x !== 'object')) return [...new Set([...a, ...b])];
    return b.length >= a.length ? b : a;
  }
  if (isObj(a) && isObj(b)) { const o = { ...a }; Object.keys(b).forEach(k => { o[k] = k in a ? mergeDeep(a[k], b[k]) : b[k]; }); return o; }
  return b === undefined ? a : b;
}
let APPLYING = false;
async function applyData(d: any) {
  const prevVer = S.settings.ver; const next: any = { ...S };
  Object.keys(d).forEach(k => { if (SYNC_SKIP.includes(k)) return; if (k === 'settings') next.settings = Object.assign({}, S.settings, d.settings); else next[k] = d[k]; });
  APPLYING = true; replaceState(normalize(next)); APPLYING = false;
  if (S.settings.ver !== prevVer && S.settings.ver !== currentVersion) { try { await useVersion(S.settings.ver); } catch (e) { } }
}

/* ---------- encryption ---------- */
const rand = (n: number) => Crypto.getRandomBytes(n);
async function derive(pass: string, saltB64: string): Promise<Uint8Array> {
  const salt = b64ToBytes(saltB64);
  const subtle: any = (globalThis as any).crypto && (globalThis as any).crypto.subtle;
  if (Platform.OS === 'web' && subtle) { const k = await subtle.importKey('raw', utf8(pass), 'PBKDF2', false, ['deriveBits']); return new Uint8Array(await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 210000 }, k, 256)); }
  return pbkdf2Async(sha256, utf8(pass), salt, { c: 210000, dkLen: 32, asyncTick: 20 });
}
function enc(key: Uint8Array, obj: any) { const iv = rand(12); const ct = gcm(key, iv).encrypt(utf8(JSON.stringify(obj))); return bytesToB64(iv) + ':' + bytesToB64(ct); }
function dec(key: Uint8Array, s: string) { const [iv, ct] = s.split(':'); return JSON.parse(fromUtf8(gcm(key, b64ToBytes(iv)).decrypt(b64ToBytes(ct)))); }
function e2eKey(): Uint8Array | null { if (SY.key) return SY.key; const raw = kvGet<string | null>('selah.ek.' + SB.uid(), null); if (!raw) return null; try { SY.key = b64ToBytes(raw); } catch (e) { SY.key = null; } return SY.key; }
function e2eKeep(key: Uint8Array) { SY.key = key; kvSet('selah.ek.' + SB.uid(), bytesToB64(key)); }

/* ---------- push / pull ---------- */
export function syQueue() { if (!SB_ON() || !SB.sess || APPLYING || syMetaGet().uid !== SB.uid()) return; syMeta({ dirty: true }); clearTimeout(SY.t); SY.t = setTimeout(syPush, 3000); }
function syFail(e: any) { syStatus(e && e.code === 'network' ? 'offline' : /relation|user_state|PGRST20[45]|42P01/i.test(String(e && (e.code + e.message))) ? 'setup' : 'error'); }
function syBody() {
  const data = snapshot(), body: any = { user_id: SB.uid(), data, device: Platform.OS + ' app' };
  if (syMetaGet().e2e) { PRIV.forEach(k => delete data[k]); const key = e2eKey(); if (key) { const p: any = {}; PRIV.forEach(k => { if ((S as any)[k] !== undefined) p[k] = (S as any)[k]; }); body.enc = enc(key, p); } }
  return body;
}
export async function syPush(): Promise<void> {
  if (!SB_ON() || !SB.sess || !SB.uid() || syMetaGet().uid !== SB.uid()) return; if (SY.busy) { clearTimeout(SY.t); SY.t = setTimeout(syPush, 1500); return; }
  SY.busy = true; syStatus('syncing');
  try {
    const head = await SB.row('updated_at,enc_salt'); const M = syMetaGet();
    if (head && M.rev && head.updated_at !== M.rev) { SY.busy = false; await syPull(true); return; }
    const row = await SB.upsert(syBody());
    syMeta({ uid: SB.uid(), rev: row && row.updated_at, dirty: false, at: Date.now() }); syStatus('ok');
  } catch (e) { syFail(e); } finally { SY.busy = false; }
}
export async function syPull(force?: boolean): Promise<void> {
  if (!SB_ON() || !SB.sess || !SB.uid() || SY.busy) return; if (syMetaGet().uid !== SB.uid()) return syLink();
  SY.busy = true; syStatus('syncing'); let pushAfter = false;
  try {
    const row = await SB.row();
    if (!row) { SY.busy = false; syMeta({ uid: SB.uid(), rev: null, dirty: true }); return syPush(); }
    syMeta({ e2e: !!row.enc_salt, salt: row.enc_salt || null, check: row.enc_check || null });
    const M = syMetaGet();
    if (!force && row.updated_at === M.rev && !M.dirty) { syMeta({ at: Date.now() }); syStatus('ok'); return; }
    const remote = row.data || {};
    if (row.enc_salt) {
      const key = e2eKey();
      if (key && row.enc) { try { Object.assign(remote, dec(key, row.enc)); SY.locked = false; } catch (e) { SY.locked = true; SY.key = null; } }
      else if (row.enc) SY.locked = true;
      if (SY.locked) { PRIV.forEach(k => delete remote[k]); if (!SY.asked) { SY.asked = true; setTimeout(() => askUnlock && askUnlock(), 600); } }
    }
    if (M.dirty) { await applyData(mergeDeep(snapshot(), remote)); pushAfter = true; } else await applyData(remote);
    syMeta({ rev: row.updated_at, at: Date.now(), dirty: pushAfter }); syStatus('ok');
  } catch (e) { syFail(e); } finally { SY.busy = false; }
  if (pushAfter) syPush();
}
async function syLink() {
  if (!SB_ON() || !SB.uid()) return;
  if (syMetaGet().uid === SB.uid()) return syPull();
  let row = null; try { row = await SB.row('updated_at'); } catch (e) { syFail(e); return; }
  if (!row) { syMeta({ uid: SB.uid(), rev: null, dirty: true, e2e: false }); return syPush(); }
  if (!localHasData()) { syMeta({ uid: SB.uid(), rev: null, dirty: false }); return syPull(true); }
  askLink && askLink();
}
export async function syChoose(merge: boolean) { syMeta({ uid: SB.uid(), rev: null, dirty: merge }); await syPull(true); notify(t(merge ? 'Your data is combined and synced' : 'Your account’s data is on this device')); }
export async function syNow() { await syPull(true); }

/* ---------- auth flows ---------- */
export async function sbSignedIn(isNew?: boolean) {
  if (!SB.sess) return; let u = SB.sess.user; try { u = await SB.user(); } catch (e) { }
  if (!SB.sess) return;
  if (u) mutate(s => { s.user = sbUserToLocal(u); s.guest = 0; s.intro = s.intro || 1; });
  const from = SB.sess.from; delete SB.sess.from; SB.store(SB.sess);
  if (from === 'recovery') askNewPw && askNewPw();
  else if (from === 'signup' || from === 'magiclink') notify(t('Email confirmed. Welcome to Selah'));
  else if (from === 'oauth') { const f = (S.user.name || '').split(' ')[0]; notify(f ? t('Signed in as {n}').replace('{n}', f) : t('Signed in')); }
  syLink();
}
/* tokens returned in a URL fragment (email links, Google, Apple) */
export async function handleAuthUrl(url: string | null) {
  if (!url || !SB_ON()) return false;
  const frag = url.includes('#') ? url.split('#')[1] : (url.split('?')[1] || '');
  const h = new URLSearchParams(frag);
  const err = h.get('error_description'); if (err) { notify(err.replace(/\+/g, ' ')); return false; }
  if (!h.get('access_token')) return false;
  SB.setToken({ access_token: h.get('access_token'), refresh_token: h.get('refresh_token'), expires_at: h.get('expires_at'), expires_in: h.get('expires_in') });
  SB.sess!.from = h.get('type') || 'oauth'; SB.store(SB.sess);
  await sbSignedIn(false); return true;
}
export async function oauth(provider: string) {
  const red = redirectUrl();
  const res = await WebBrowser.openAuthSessionAsync(SUPABASE.url + '/auth/v1/authorize?provider=' + encodeURIComponent(provider) + '&redirect_to=' + encodeURIComponent(red), red);
  if (res.type === 'success' && res.url) return handleAuthUrl(res.url);
  return false;
}
export async function signOut(wipe: boolean) {
  if (syMetaGet().dirty) { try { await syPush(); } catch (e) { } }
  await SB.signOut(); const uid = syMetaGet().uid; if (uid) kvSet('selah.ek.' + uid, null); SY.key = null; SY.locked = false; SY.asked = false;
  if (wipe) { const keep = { settings: S.settings, lock: S.lock, intro: S.intro }; replaceState(normalize({ ...DEF(), ...keep })); syMeta({ uid: null, rev: null, dirty: false, at: 0, e2e: false }); }
  else syMeta({ uid: null, rev: null, dirty: false });
  mutate(s => { s.user = null; s.guest = 0; }, { quiet: true }); await flush();
}
export async function deleteAccount() {
  try { await SB.deleteAccount(); } catch (e) { try { await SB.delRow(); } catch (_) { } }
  await SB.signOut(); const uid = syMetaGet().uid; if (uid) kvSet('selah.ek.' + uid, null); syMeta({ uid: null, rev: null, dirty: false, at: 0, e2e: false });
  mutate(s => { s.user = null; s.guest = 0; }, { quiet: true });
}
export async function e2eOn(pass: string) {
  const salt = bytesToB64(rand(16)), key = await derive(pass, salt); e2eKeep(key);
  syMeta({ e2e: true }); const body = syBody(); body.enc_salt = salt; body.enc_check = enc(key, { ok: 'selah' });
  try { const row = await SB.upsert(body); syMeta({ rev: row && row.updated_at, salt, dirty: false, at: Date.now() }); syStatus('ok'); }
  catch (e) { syMeta({ e2e: false }); throw e; }
}
export async function e2eOff() {
  const key = e2eKey(); if (!key) { askUnlock && askUnlock(); return false; }
  syMeta({ e2e: false }); const body = syBody(); Object.assign(body, { enc: null, enc_salt: null, enc_check: null });
  try { const row = await SB.upsert(body); kvSet('selah.ek.' + SB.uid(), null); SY.key = null; syMeta({ rev: row && row.updated_at, salt: null, dirty: false, at: Date.now() }); syStatus('ok'); return true; }
  catch (e) { syMeta({ e2e: true }); throw e; }
}
export async function e2eUnlock(pass: string) {
  const row = await SB.row('enc_salt,enc_check'); const key = await derive(pass, row.enc_salt);
  let ok: any = null; try { ok = dec(key, row.enc_check); } catch (e) { }
  if (!ok || ok.ok !== 'selah') { const er: any = new Error('bad'); er.bad = true; throw er; }
  e2eKeep(key); SY.locked = false; syMeta({ dirty: true }); await syPull(true);
}
export async function e2eForget() {
  syMeta({ e2e: false }); SY.locked = false; const body = syBody(); Object.assign(body, { enc: null, enc_salt: null, enc_check: null });
  const row = await SB.upsert(body); syMeta({ rev: row && row.updated_at, dirty: false, at: Date.now() }); syStatus('ok');
}

export function bootSync() {
  SB.load();
  if (SB.uid()) kvGetAsync('selah.ek.' + SB.uid(), null);
  onSave(syQueue);
  Linking.getInitialURL().then(u => { if (u && u.includes('access_token')) handleAuthUrl(u); }).catch(() => {});
  Linking.addEventListener('url', e => { if (e.url && (e.url.includes('access_token') || e.url.includes('error_description'))) handleAuthUrl(e.url); });
  if (!SB_ON()) return;
  if (SB.sess) sbSignedIn(false).catch(() => {});
  else if (S.user && !S.user.id) mutate(s => { s.user = null; }, { quiet: true });
  AppState.addEventListener('change', st => { if (st === 'active' && SB.sess && Date.now() - SY.last > 20000) { SY.last = Date.now(); syMetaGet().dirty ? syPush() : syPull(); } });
  setInterval(() => { if (SB.sess && AppState.currentState === 'active') { SY.last = Date.now(); syMetaGet().dirty ? syPush() : syPull(); } }, 120000);
}
export { save };
