/* First run: welcome (Get started / Log in), a six-slide feature tour, then
   sign in / create account / reset password, backed by Supabase. */
import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, KeyboardAvoidingView, NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { S, mutate, useStore } from '../lib/store';
import { LANGS, ONB, TEST_AUTH } from '../lib/content';
import { t } from '../lib/i18n';
import { setLang } from '../lib/lang';
import { SB, SB_ON, oauth, sbErr, sbSignedIn } from '../lib/sync';
import { Btn, Field, IconBtn, Input, LinkBtn, OkMsg, Seg, Title, Txt, useC, tap } from '../ui/kit';
import { Icon } from '../ui/Icon';
import { Mark } from '../ui/Ribbon';
import { FadeTo, Photo } from '../ui/Photo';
import { AppleLogo, GoogleLogo } from '../ui/Brand';
import { toast, toastRaw } from '../ui/overlay';
import { block } from '../lib/theme';

type Mode = 'welcome' | 'onb' | 'signin' | 'signup' | 'reset' | 'confirm';
export let openAuthMode: (m: Mode) => void = () => {};

export function AuthFlow() {
  const c = useC(); useStore();
  const [mode, setMode] = useState<Mode>('welcome');
  useEffect(() => { openAuthMode = setMode; }, []);
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { if (mode === 'welcome') return false; setMode(mode === 'reset' || mode === 'confirm' ? 'signin' : mode === 'onb' ? 'welcome' : 'welcome'); return true; });
    return () => sub.remove();
  }, [mode]);
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 120, backgroundColor: c.bg }}>
      {mode === 'welcome' ? <Welcome go={setMode} /> : mode === 'onb' ? <Onboarding go={setMode} /> : <AuthForm mode={mode} go={setMode} />}
    </View>
  );
}

function LangPick({ dark }: { dark?: boolean }) {
  const S2 = useStore(); const c = useC();
  return (
    <View style={{ flexDirection: 'row', gap: 4, padding: 4, borderRadius: 999, backgroundColor: dark ? 'rgba(255,255,255,0.16)' : c.surface2 }}>
      {Object.keys(LANGS).map(k => { const on = S2.settings.lang === k; return (
        <Pressable key={k} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={LANGS[k].n} onPress={() => { tap(); setLang(k); }} style={{ minWidth: 38, height: 32, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? (dark ? '#fff' : c.pill) : 'transparent' }}>
          <Txt w={700} size={12} tr={false} color={on ? (dark ? '#17101F' : c.onPill) : dark ? '#fff' : c.muted}>{k.toUpperCase()}</Txt>
        </Pressable>); })}
    </View>
  );
}

function Welcome({ go }: { go: (m: Mode) => void }) {
  const ins = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: '#0d0912' }}>
      <Photo slot="peace" overlay="welcome" width={1200} />
      <View style={{ flex: 1, paddingTop: ins.top + 16, paddingHorizontal: 16, paddingBottom: ins.bottom + 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Mark size={36} /><Txt w={700} size={22} ls={-0.03} color="#fff" tr={false}>Selah</Txt></View>
          <LangPick dark />
        </View>
        <View style={{ flex: 1, minHeight: 200 }} />
        <Title a="Pause, pray" b="and be still." size={50} color="#fff" />
        <Txt size={17} color="rgba(255,255,255,0.82)" style={{ marginTop: 12, maxWidth: 330 }}>Scripture affirmations, deep prayer and quiet freedom, in one gentle place.</Txt>
        <View style={{ gap: 10, marginTop: 26 }}>
          <Pressable accessibilityRole="button" onPress={() => { tap(); go('onb'); }} style={({ pressed }) => ({ minHeight: 58, borderRadius: 999, backgroundColor: '#F4F01E', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 26, paddingRight: 6, opacity: pressed ? 0.9 : 1 })}>
            <Txt w={600} size={18} color="#17101F">Get started</Txt>
            <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: '#17101F', alignItems: 'center', justifyContent: 'center' }}><Icon name="arrow" color="#F4F01E" /></View>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => { tap(); go('signin'); }} style={{ minHeight: 58, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }}>
            <Txt w={600} size={16} color="#fff">I already have an account</Txt>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function Onboarding({ go }: { go: (m: Mode) => void }) {
  const c = useC(); const ins = useSafeAreaInsets(); const { width, height } = useWindowDimensions();
  const [i, setI] = useState(0); const sv = useRef<ScrollView>(null);
  const last = i === ONB.length - 1;
  const to = (n: number) => { const x = Math.max(0, Math.min(ONB.length - 1, n)); setI(x); sv.current && sv.current.scrollTo({ x: x * width, animated: true }); };
  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => setI(Math.round(e.nativeEvent.contentOffset.x / width));
  const photoH = Math.min(height * 0.5, 470);
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView ref={sv} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onEnd} scrollEventThrottle={16}>
        {ONB.map((s, j) => { const { cb, ci } = block(s.k); return (
          <ScrollView key={j} style={{ width }} contentContainerStyle={{ paddingBottom: 150 + ins.bottom }}>
            <View style={{ height: photoH }}>
              <Photo slot={s.ph} overlay="none" width={1000} />
              <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: photoH * 0.55 }}><FadeTo color={c.bg} /></View>
            </View>
            <View style={{ paddingHorizontal: 16, marginTop: -40 }}>
              <Title a={s.a} b={s.b} size={42} />
              <Txt muted size={16.5} lh={1.5} style={{ marginTop: 12, marginBottom: 16 }}>{s.p}</Txt>
              <View style={{ gap: 10 }}>{s.pts.map((p, k) => (
                <View key={k} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: cb, alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={15} color={ci} stroke={2.8} /></View>
                  <Txt w={600} size={15.5} style={{ flex: 1 }}>{p}</Txt>
                </View>))}</View>
            </View>
          </ScrollView>); })}
      </ScrollView>
      <View pointerEvents="box-none" style={{ position: 'absolute', top: ins.top + 10, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconBtn name="chevl" a11y="Back" onPress={() => i > 0 ? to(i - 1) : go('welcome')} bg="rgba(255,255,255,0.18)" color="#fff" />
        <View style={{ flexDirection: 'row', gap: 6 }}>{ONB.map((_, j) => <View key={j} style={{ width: j === i ? 26 : 8, height: 8, borderRadius: 999, backgroundColor: j === i ? '#F4F01E' : j < i ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.35)' }} />)}</View>
        {last ? <View style={{ width: 46 }} /> : <Pressable onPress={() => to(ONB.length - 1)} style={{ minWidth: 46, alignItems: 'flex-end' }}><Txt w={600} color="#fff">Skip</Txt></Pressable>}
      </View>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 22, paddingBottom: ins.bottom + 16, backgroundColor: c.bg }}>
        {last ? (
          <View style={{ gap: 6 }}>
            <Btn kind="lemon" label="Create my account" style={{ minHeight: 58 }} onPress={() => { mutate(s => { s.intro = 1; }); go('signup'); }} />
            <LinkBtn label="I already have an account" onPress={() => go('signin')} color={c.ink} style={{ alignSelf: 'center', paddingVertical: 8 }} />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Txt w={600} size={14} muted tr={false}>{(i + 1) + ' / ' + ONB.length}</Txt>
            <Pressable accessibilityRole="button" accessibilityLabel={t('Next')} onPress={() => { tap(); to(i + 1); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6, paddingRight: 6, paddingLeft: 24, borderRadius: 999, backgroundColor: c.pill }}>
              <Txt w={700} size={17} color={c.onPill}>Next</Txt>
              <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: '#F4F01E', alignItems: 'center', justifyContent: 'center' }}><Icon name="arrowr" color="#17101F" /></View>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

function AuthForm({ mode, go }: { mode: Mode; go: (m: Mode) => void }) {
  const c = useC(); const ins = useSafeAreaInsets();
  const [v, setV] = useState({ name: '', email: '', password: '' }); const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(''); const [errs, setErrs] = useState<Record<string, string>>({}); const [sent, setSent] = useState(false);
  const [providers, setProviders] = useState<Record<string, boolean> | null>(null);
  useEffect(() => { if (SB_ON()) SB.settings().then(cfg => setProviders((cfg && cfg.external) || {})); }, []);
  const signup = mode === 'signup', reset = mode === 'reset';
  const head = signup ? ['Begin your', 'journey.', 'Create an account to keep your goals, notes and highlights safe.'] : reset ? ['Reset your', 'password.', 'Enter the email you signed up with and we’ll send you a link.'] : mode === 'confirm' ? ['Check your', 'inbox.', ''] : ['Welcome', 'back.', 'Sign in to pick up where you left off.'];
  const set = (k: string, val: string) => { setV(x => ({ ...x, [k]: val })); if (errs[k]) setErrs(e => { const n = { ...e }; delete n[k]; return n; }); };
  const finishTest = () => { const email = v.email.trim(), name = v.name.trim() || (email ? email.split('@')[0] : '') || 'Friend'; mutate(s => { s.user = { id: 'test', name, email, provider: 'email', at: Date.now(), test: true }; s.guest = 0; s.intro = 1; }); toastRaw(signup ? t('Welcome to Selah') + ', ' + name.split(' ')[0] : t('Signed in as {n}').replace('{n}', name.split(' ')[0])); };
  const validate = () => {
    if (TEST_AUTH) return true; const e: Record<string, string> = {};
    if (signup && !v.name.trim()) e.name = t('Enter your name.');
    if (!v.email.trim()) e.email = t('Enter your email.'); else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = t('That email doesn’t look right. Check for typos.');
    if (!reset) { if (!v.password) e.password = t('Enter your password.'); else if (signup && v.password.length < 8) e.password = t('Use at least 8 characters.'); }
    setErrs(e); return !Object.keys(e).length;
  };
  const submit = async () => {
    if (TEST_AUTH) { if (reset) { setSent(true); return; } finishTest(); return; }
    if (!validate()) return;
    setBusy(reset ? 'reset' : 'email');
    try {
      if (reset) { await SB.recover(v.email.trim()); setSent(true); }
      else if (signup) { const s = await SB.signUp(v.email.trim(), v.password, v.name.trim()); if (!s) { setBusy(''); go('confirm'); return; } await sbSignedIn(true); toast('Welcome to Selah'); }
      else { await SB.signIn(v.email.trim(), v.password); await sbSignedIn(false); const f = (S.user && S.user.name || '').split(' ')[0]; toastRaw(f ? t('Signed in as {n}').replace('{n}', f) : t('Signed in')); }
    } catch (err) { const m = sbErr(err); setErrs(/email/i.test(m) && !/password/i.test(m) ? { email: m } : { password: m }); }
    setBusy('');
  };
  const doOauth = async (p: string) => {
    if (TEST_AUTH && !SB_ON()) { finishTest(); return; }
    if (providers && !providers[p.toLowerCase()]) { toast(p + ' sign-in isn’t switched on yet. Use your email for now.'); return; }
    setBusy(p); try { await oauth(p.toLowerCase()); } catch (e) { toast('Something went wrong. Try again.'); } setBusy('');
  };
  const err = (k: string) => errs[k] ? <Txt size={13.5} color={c.danger} tr={false} style={{ marginTop: 6 }}>{errs[k]}</Txt> : null;
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: ins.bottom + 30 }}>
        <View style={{ height: 300 + ins.top, marginBottom: -150 }}>
          <Photo slot={signup ? 'sunrise' : reset ? 'lake' : mode === 'confirm' ? 'peace' : 'faith'} overlay="none" />
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 220 }}><FadeTo color={c.bg} /></View>
        </View>
        <View style={{ position: 'absolute', top: ins.top + 12, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <IconBtn name="chevl" a11y="Back" bg="rgba(255,255,255,0.18)" color="#fff" onPress={() => go(reset || mode === 'confirm' ? 'signin' : 'welcome')} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Mark size={36} /><Txt w={700} size={22} color="#fff" tr={false}>Selah</Txt></View>
        </View>
        <View style={{ paddingHorizontal: 20 }}>
          <Title a={head[0]} b={head[1]} size={46} />
          {head[2] ? <Txt muted size={15.5} style={{ marginTop: 10, maxWidth: 340 }}>{head[2]}</Txt> : null}
          {mode === 'confirm' ? <Txt muted size={15.5} tr={false} style={{ marginTop: 10 }}>{t('We sent a link to') + ' ' + v.email + '. ' + t('Tap it to confirm your email, and you’ll be signed in.')}</Txt> : null}
          {TEST_AUTH && mode !== 'confirm' ? <View style={{ alignSelf: 'flex-start', marginTop: 12, backgroundColor: '#F4F01E', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 }}><Txt w={700} size={12.5} color="#17101F">Test mode: no sign-in checks</Txt></View> : null}
        </View>
        <View style={{ paddingHorizontal: 18, paddingTop: 22 }}>
          {mode === 'confirm' ? (<>
            <Btn kind="primary" block label="Send the link again" busy={busy === 'resend'} onPress={async () => { setBusy('resend'); try { await SB.resend(v.email.trim()); toast('Sent. Check your inbox.'); } catch (e) { toastRaw(sbErr(e)); } setBusy(''); }} />
            <LinkBtn label="Back to sign in" color={c.ink} onPress={() => go('signin')} style={{ alignSelf: 'center', marginTop: 16 }} />
          </>) : reset ? (sent ? (<>
            <OkMsg title={t('Check your inbox')} body={t('If an account exists for') + ' ' + v.email + ', ' + t('a reset link is on its way.')} />
            <Btn kind="primary" block label="Back to sign in" onPress={() => go('signin')} />
          </>) : (<>
            <Field label="Email"><Input value={v.email} onChangeText={x => set('email', x)} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="you@example.com" bad={!!errs.email} />{err('email')}</Field>
            <Btn kind="primary" block label="Send reset link" busy={busy === 'reset'} onPress={submit} />
            <LinkBtn label="Back to sign in" color={c.ink} onPress={() => go('signin')} style={{ alignSelf: 'center', marginTop: 16 }} />
          </>)) : (<>
            <Seg options={[['signin', 'Sign in'], ['signup', 'Create account']]} value={mode} onChange={m => { setErrs({}); go(m as Mode); }} style={{ marginBottom: 22 }} />
            {signup ? <Field label="Your name"><Input value={v.name} onChangeText={x => set('name', x)} autoComplete="name" placeholder="What should we call you?" bad={!!errs.name} />{err('name')}</Field> : null}
            <Field label="Email"><Input value={v.email} onChangeText={x => set('email', x)} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="you@example.com" bad={!!errs.email} />{err('email')}</Field>
            <Field label="Password">
              <View>
                <Input value={v.password} onChangeText={x => set('password', x)} secureTextEntry={!show} autoCapitalize="none" autoComplete={signup ? 'new-password' : 'current-password'} placeholder={signup ? 'At least 8 characters' : 'Your password'} bad={!!errs.password} onSubmitEditing={submit} style={{ paddingRight: 56 }} />
                <Pressable accessibilityLabel={t(show ? 'Hide password' : 'Show password')} onPress={() => setShow(!show)} style={{ position: 'absolute', right: 6, top: 4, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Icon name={show ? 'eyeoff' : 'eye'} color={c.muted} /></Pressable>
              </View>
              {err('password')}
            </Field>
            {!signup ? <View style={{ alignItems: 'flex-end', marginTop: -8, marginBottom: 18 }}><LinkBtn label="Forgot password?" onPress={() => go('reset')} /></View> : null}
            <Btn kind="primary" block label={signup ? 'Create account' : 'Sign in'} busy={busy === 'email'} onPress={submit} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 22 }}><View style={{ flex: 1, height: 1, backgroundColor: c.line }} /><Txt muted size={14}>or</Txt><View style={{ flex: 1, height: 1, backgroundColor: c.line }} /></View>
            <View style={{ gap: 10 }}>
              <Pressable accessibilityRole="button" onPress={() => doOauth('Google')} style={{ minHeight: 52, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: '#DADCE0', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, opacity: providers && !providers.google ? 0.6 : 1 }}>
                <GoogleLogo /><Txt w={600} size={16} color="#1F1F1F">Continue with Google</Txt>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => doOauth('Apple')} style={{ minHeight: 52, borderRadius: 999, backgroundColor: '#000', borderWidth: 1, borderColor: '#3a3a3a', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, opacity: providers && !providers.apple ? 0.6 : 1 }}>
                <AppleLogo size={20} /><Txt w={600} size={16} color="#fff">Continue with Apple</Txt>
              </Pressable>
            </View>
            <Txt muted size={13} center lh={1.5} style={{ marginTop: 20 }}>By continuing you agree to the Terms of use and Privacy policy.</Txt>
          </>)}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
