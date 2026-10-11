import { storageGet, storageSet } from '../../lib/device';

const KEY = 'dc_spin_sound';

export function soundEnabled(): boolean {
  return storageGet<boolean>(KEY, true) !== false;
}
export function setSoundEnabled(on: boolean): void {
  storageSet(KEY, on);
}

type Ctx = AudioContext;
let ctx: Ctx | null = null;

function getCtx(): Ctx | null {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Short mechanical "tick" (wheel pointer passing a peg). Tiny and synthesized – no audio files. */
export function playTick(): void {
  if (!soundEnabled()) return;
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(1900, t);
  osc.frequency.exponentialRampToValueAtTime(700, t + 0.035);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.07, t + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.05);
}

/** Three note win jingle. */
export function playWin(): void {
  if (!soundEnabled()) return;
  const c = getCtx();
  if (!c) return;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => {
    const t = c.currentTime + i * 0.11;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.09, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  });
}

/** Soft "nope" for no-prize results. */
export function playMiss(): void {
  if (!soundEnabled()) return;
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(330, t);
  osc.frequency.exponentialRampToValueAtTime(180, t + 0.25);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.06, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.32);
}
