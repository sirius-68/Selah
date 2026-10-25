/* Account sheets: sign out, combine data, encryption on / unlock, new password, delete account. */
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { S } from '../lib/store';
import { t } from '../lib/i18n';
import { SB, deleteAccount, e2eForget, e2eOn, e2eUnlock, sbErr, signOut, syChoose, syncUI } from '../lib/sync';
import { Btn, Field, Input, OkMsg, Txt, useC, tap } from '../ui/kit';
import { closeSheet, openSheet, SheetTitle, toast, toastRaw } from '../ui/overlay';
import { openAuthMode } from '../screens/AuthFlow';

function Choice({ title, body, onPress }: { title: string; body: string; onPress: () => void }) {
  const c = useC();
  return <Pressable onPress={() => { tap(); onPress(); }} style={({ pressed }) => ({ padding: 16, borderRadius: 22, backgroundColor: pressed ? c.line : c.surface2, marginBottom: 10 })}>
    <Txt w={700} size={16}>{title}</Txt><Txt muted size={14} style={{ marginTop: 2 }}>{body}</Txt></Pressable>;
}

export function openSignOut() {
  openSheet(<View>
    <SheetTitle>Sign out?</SheetTitle>
    <Txt muted style={{ marginTop: -8, marginBottom: 16 }}>Your data is saved in your account. Choose what stays on this device.</Txt>
    <Choice title="Keep a copy on this device" body="Use Selah here without an account until you sign in again." onPress={async () => { closeSheet(); await signOut(false); openAuthMode('welcome'); toast('Signed out'); }} />
    <Choice title="Remove my data from this device" body="Best on a shared phone. Everything comes back when you sign in." onPress={async () => { closeSheet(); await signOut(true); openAuthMode('welcome'); toast('Signed out'); }} />
  </View>);
}
function openLink() {
  openSheet(<View>
    <SheetTitle>Bring your data together?</SheetTitle>
    <Txt muted style={{ marginTop: -8, marginBottom: 16 }}>This device and your account both have goals, notes or journal entries.</Txt>
    <Choice title="Combine both" body="Keep everything from this device and your account. Recommended." onPress={() => { closeSheet(); syChoose(true); }} />
    <Choice title="Use my account’s copy" body="Replace what’s on this device with what’s saved in your account." onPress={() => { closeSheet(); syChoose(false); }} />
  </View>, { locked: true, lockedMsg: 'Choose one to continue' });
}
export function openE2E() { openSheet(<E2ESheet />); }
function E2ESheet() {
  const [p1, setP1] = useState(''); const [p2, setP2] = useState(''); const [busy, setBusy] = useState(false);
  return <View>
    <SheetTitle>End-to-end encryption</SheetTitle>
    <Txt muted style={{ marginTop: -8, marginBottom: 16 }}>Break free, journals, notes and prayer logs are locked with a passphrase before they leave this device. Nobody else can read them, not even the app’s owner.</Txt>
    <Field label="Passphrase"><Input value={p1} onChangeText={setP1} secureTextEntry autoCapitalize="none" placeholder="At least 8 characters" /></Field>
    <Field label="Repeat passphrase"><Input value={p2} onChangeText={setP2} secureTextEntry autoCapitalize="none" /></Field>
    <OkMsg warn title={t('Write it down somewhere safe')} body={t('If you forget it, your encrypted data can’t be recovered on a new device.')} />
    <Btn kind="primary" block busy={busy} label="Turn on encryption" onPress={async () => {
      if (p1.length < 8) { toast('Use at least 8 characters.'); return; } if (p1 !== p2) { toast('Those passphrases don’t match'); return; }
      setBusy(true); try { await e2eOn(p1); closeSheet(); toast('Encryption is on'); } catch (e) { toastRaw(sbErr(e)); } setBusy(false);
    }} />
  </View>;
}
export function openUnlock() { openSheet(<UnlockSheet />); }
function UnlockSheet() {
  const [p, setP] = useState(''); const [busy, setBusy] = useState(false); const [armed, setArmed] = useState(false); const c = useC();
  return <View>
    <SheetTitle>Unlock your private data</SheetTitle>
    <Txt muted style={{ marginTop: -8, marginBottom: 16 }}>Your Break free, journal and notes are end-to-end encrypted. Enter your passphrase to use them on this device.</Txt>
    <Field label="Passphrase"><Input value={p} onChangeText={setP} secureTextEntry autoCapitalize="none" /></Field>
    <Btn kind="primary" block busy={busy} label="Unlock" onPress={async () => { setBusy(true); try { await e2eUnlock(p); closeSheet(); toast('Unlocked'); } catch (e: any) { toastRaw(e && e.code === 'network' ? sbErr(e) : t('That passphrase isn’t right')); } setBusy(false); }} />
    <Pressable onPress={async () => { if (!armed) { setArmed(true); return; } try { await e2eForget(); closeSheet(); toast('Done. You can turn encryption on again in Settings.'); } catch (e) { toastRaw(sbErr(e)); } }} style={{ marginTop: 16, alignSelf: 'center' }}>
      <Txt w={600} color={c.accent} center>{armed ? 'Tap again to replace the encrypted copy with this device’s data' : 'Forgot it? Use this device’s copy instead'}</Txt>
    </Pressable>
  </View>;
}
function openNewPassword() { openSheet(<NewPw />); }
function NewPw() {
  const [p, setP] = useState('');
  return <View>
    <SheetTitle>Set a new password</SheetTitle>
    <Txt muted tr={false} style={{ marginTop: -8, marginBottom: 16 }}>{t('Choose a new password for') + ' ' + ((S.user && S.user.email) || t('your account')) + '.'}</Txt>
    <Field label="New password"><Input value={p} onChangeText={setP} secureTextEntry autoCapitalize="none" placeholder="At least 8 characters" /></Field>
    <Btn kind="primary" block label="Save password" onPress={async () => { if (p.length < 8) { toast('Use at least 8 characters.'); return; } try { await SB.updateUser({ password: p }); closeSheet(); toast('Password updated'); } catch (e) { toastRaw(sbErr(e)); } }} />
  </View>;
}
export function openDeleteAccount() { openSheet(<DelAcct />); }
function DelAcct() {
  const [armed, setArmed] = useState(false);
  return <View>
    <SheetTitle>Delete your account?</SheetTitle>
    <Txt muted style={{ marginTop: -8, marginBottom: 16 }}>This permanently deletes your account and everything saved in the cloud. The copy on this device stays until you remove it.</Txt>
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <Btn label="Cancel" style={{ flex: 1 }} onPress={closeSheet} />
      <Btn kind="danger" label={armed ? 'Tap again to delete for good' : 'Delete account'} style={{ flex: 1 }} onPress={async () => { if (!armed) { setArmed(true); return; } await deleteAccount(); closeSheet(); openAuthMode('welcome'); toast('Your account is deleted'); }} />
    </View>
  </View>;
}
export function registerAccountUI() { syncUI({ toast: toastRaw, link: openLink, unlock: openUnlock, newPassword: openNewPassword }); }
