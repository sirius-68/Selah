import { Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { t } from './i18n';
import { toast } from '../ui/overlay';

export async function copyText(s: string) { try { await Clipboard.setStringAsync(s); return true; } catch (e) { return false; } }
export async function shareText(text: string) {
  try { await Share.share({ message: text }); } catch (e) { toast((await copyText(text)) ? 'Copied to clipboard' : 'Could not copy'); }
}

/* the share-card studio reads what to draw from here */
export type CardData = { aff?: string; text: string; ref: string; label?: string; key?: string; v?: number };
export let CARD: CardData | null = null;
export function openCard(d: CardData) { CARD = d; router.push('/card'); }
export { t };
