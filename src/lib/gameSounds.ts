import type { GameState } from '@/game/types';

const SFX_MUTED_STORAGE_KEY = 'solo-deck-sfx-muted';

/** Persisted mute for synthesized SFX (localStorage). */
export function getGameSfxMuted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(SFX_MUTED_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setGameSfxMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (muted) window.localStorage.setItem(SFX_MUTED_STORAGE_KEY, '1');
    else window.localStorage.removeItem(SFX_MUTED_STORAGE_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}

/** Master gain ~0–1; tweak for overall loudness. */
const MASTER = 0.12;

let audioCtx: AudioContext | null = null;

/** Browsers require a user gesture before AudioContext runs; call from interactions. */
export function resumeGameAudio(): void {
  if (typeof window === 'undefined') return;
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') void audioCtx.resume();
}

function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function now(c: AudioContext): number {
  return c.currentTime;
}

function tone(
  c: AudioContext,
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  peak = MASTER
): void {
  const t0 = now(c);
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function sweep(c: AudioContext, f0: number, f1: number, duration: number, peak = MASTER): void {
  const t0 = now(c);
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(f0, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(f1, 20), t0 + duration);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.03);
}

function playSelect(): void {
  const c = ctx();
  if (!c) return;
  tone(c, 1100, 0.028, 'square', MASTER * 0.45);
}

function playDeny(): void {
  const c = ctx();
  if (!c) return;
  tone(c, 140, 0.11, 'sawtooth', MASTER * 0.55);
  tone(c, 95, 0.14, 'triangle', MASTER * 0.35);
}

function playDeploy(): void {
  const c = ctx();
  if (!c) return;
  tone(c, 380, 0.06, 'sine', MASTER * 0.85);
  window.setTimeout(() => tone(c, 520, 0.08, 'sine', MASTER * 0.75), 55);
}

function playOperation(): void {
  const c = ctx();
  if (!c) return;
  const freqs = [520, 680, 880];
  freqs.forEach((f, i) => {
    window.setTimeout(() => tone(c, f, 0.1, 'triangle', MASTER * 0.7), i * 72);
  });
}

function playAbility(): void {
  const c = ctx();
  if (!c) return;
  tone(c, 660, 0.045, 'sine', MASTER * 0.65);
  tone(c, 990, 0.04, 'sine', MASTER * 0.35);
}

function playDiscard(): void {
  const c = ctx();
  if (!c) return;
  tone(c, 320, 0.05, 'sine', MASTER * 0.5);
  window.setTimeout(() => tone(c, 240, 0.06, 'triangle', MASTER * 0.45), 40);
}

function playMod(): void {
  const c = ctx();
  if (!c) return;
  tone(c, 920, 0.032, 'square', MASTER * 0.4);
}

function playNewCycle(): void {
  const c = ctx();
  if (!c) return;
  sweep(c, 180, 420, 0.22, MASTER * 0.7);
  window.setTimeout(() => tone(c, 740, 0.06, 'sine', MASTER * 0.35), 160);
}

function playWin(): void {
  const c = ctx();
  if (!c) return;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
    window.setTimeout(() => tone(c, f, 0.22, 'sine', MASTER * 0.55), i * 95);
  });
}

function playLose(): void {
  const c = ctx();
  if (!c) return;
  [330, 277, 220, 165].forEach((f, i) => {
    window.setTimeout(() => tone(c, f, 0.16, 'triangle', MASTER * 0.5), i * 110);
  });
}

function playUiConfirmSound(): void {
  const c = ctx();
  if (!c) return;
  tone(c, 440, 0.06, 'sine', MASTER * 0.5);
  window.setTimeout(() => tone(c, 660, 0.08, 'sine', MASTER * 0.45), 70);
}

/** Short UI blip (e.g. start game); respects mute. */
export function playUiConfirm(): void {
  if (getGameSfxMuted()) return;
  playUiConfirmSound();
}

/** Dedupe identical transitions within one tick (React Strict Mode double-invoke). */
let lastDedupeKey = '';
let lastDedupeAt = 0;

function shouldPlay(key: string): boolean {
  const t = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (key === lastDedupeKey && t - lastDedupeAt < 32) return false;
  lastDedupeKey = key;
  lastDedupeAt = t;
  return true;
}

/**
 * Plays one short SFX based on what changed between engine states.
 * Uses log text and phase/round so we only celebrate real successes.
 */
export function playSoundAfterTransition(prev: GameState, next: GameState): void {
  if (prev === next) return;
  if (getGameSfxMuted()) return;

  const key = `${prev.log.length}|${next.log.length}|${next.round}|${next.phase}|${next.score}|${next.gameResult ?? ''}|${prev.selectedDiceIds.join(',')}>${next.selectedDiceIds.join(',')}`;
  if (!shouldPlay(key)) return;

  // Game over (takes priority over deploy / operation in same update)
  if (next.phase === 'game-over' && prev.phase !== 'game-over') {
    if (next.gameResult === 'win') playWin();
    else playLose();
    return;
  }

  // End cycle → new ready phase with incremented round
  if (prev.phase === 'action' && next.round > prev.round) {
    playNewCycle();
    return;
  }

  // Selection toggles (no new log lines)
  if (next.log === prev.log) {
    if (next.selectedDiceIds !== prev.selectedDiceIds) playSelect();
    return;
  }

  const newText = next.log.slice(prev.log.length).join('\n');
  if (newText.includes('🔁 New run')) {
    playUiConfirmSound();
    return;
  }
  if (newText.includes('❌')) {
    playDeny();
    return;
  }
  if (newText.includes('💾 Deployed')) {
    playDeploy();
    return;
  }
  if (newText.includes('🎯 Executed')) {
    playOperation();
    return;
  }
  if (newText.includes('🗑️ Discarded')) {
    playDiscard();
    return;
  }
  if (newText.includes('🔧 Modified die')) {
    playMod();
    return;
  }

  // Successful colony ability, Code Lab draw, etc.
  playAbility();
}
