import { useEffect, useReducer } from 'react';
import { onSound } from './sound';
import { onBibleUI } from '../screens/bibleNav';

/* re-render every `ms` (countdowns, live counters) */
export function useTick(ms: number) { const [n, f] = useReducer(x => x + 1, 0); useEffect(() => { const i = setInterval(f, ms); return () => clearInterval(i); }, [ms]); return n; }
export function useSound() { const [, f] = useReducer(x => x + 1, 0); useEffect(() => onSound(f), []); }
export function useBibleUI() { const [, f] = useReducer(x => x + 1, 0); useEffect(() => onBibleUI(f), []); }
export function useForce() { const [, f] = useReducer(x => x + 1, 0); return f as () => void; }
