import { S, mutate } from './store';
import { useVersion } from './bible';
import { VERS } from './content';
import { t } from './i18n';
import { toast, toastRaw } from '../ui/overlay';

/* switch language; the Bible follows unless the user picked a version */
export async function setLang(l: string) {
  const want = ({ en: 'kjv', fr: 'lsg', ru: 'syn' } as Record<string, string>)[l];
  if (!S.settings.verPicked && S.settings.ver !== want) { try { await useVersion(want); mutate(s => { s.settings.ver = want; }); } catch (e) { } }
  mutate(s => { s.settings.lang = l; });
  toastRaw(l === 'en' ? 'Language: English' : l === 'fr' ? 'Langue : français' : 'Язык: русский');
}
export async function setVersion(id: string, quiet?: boolean) {
  try { await useVersion(id); mutate(s => { s.settings.ver = id; s.settings.verPicked = true; }); if (!quiet) toastRaw(t('Bible version changed to') + ' ' + VERS[id].n); }
  catch (e) { toast('This Bible version can’t be opened on this device'); }
}
