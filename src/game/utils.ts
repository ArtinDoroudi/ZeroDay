import { Die, DiceType } from './types';

let nextId = 1;
export const genId = () => `id_${nextId++}_${Math.random().toString(36).slice(2, 6)}`;

export function rollDie(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export function createDie(value: number, type: DiceType, preserved = false): Die {
  return { id: genId(), value, type, preserved, selected: false };
}

export function rollBasicDice(count: number): Die[] {
  return Array.from({ length: count }, () => createDie(rollDie(), 'basic'));
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function wrapDiceValue(v: number, delta: number): number {
  let result = v + delta;
  if (result > 6) result = 1;
  if (result < 1) result = 6;
  return result;
}
