export type DiceType = 'basic' | 'fixed' | 'wild';

export interface Die {
  id: string;
  value: number;
  type: DiceType;
  preserved: boolean;
  selected: boolean;
}

export type CardCategory = 'basic' | 'settlement' | 'drone' | 'utility' | 'advanced' | 'passive' | 'project';

export type CostType =
  | { kind: 'specific'; values: number[] }
  | { kind: 'three-in-a-row' }
  | { kind: 'four-in-a-row' }
  | { kind: 'five-in-a-row' }
  | { kind: 'three-of-a-kind' }
  | { kind: 'four-of-a-kind' }
  | { kind: 'pair' }
  | { kind: 'two-pairs-in-a-row' }
  | { kind: 'sum'; total: number; exactCount?: number }
  | { kind: 'wild'; count: number }
  | { kind: 'seven-of-a-kind' }
  | { kind: 'six-same'; value: number }
  | { kind: 'two-sets-four-of-a-kind' }
  | { kind: 'six-in-a-row' }
  | { kind: 'two-triples' }
  | { kind: 'five-pairs' }
  | { kind: 'ten-same-parity'; parity: 'odd' | 'even' | 'either' }
  | { kind: 'eight-alternating' }
  | { kind: 'none' };

export type ActivationType = 'passive' | 'start-of-turn' | 'click' | 'end-of-turn' | 'enter-play' | 'conditional';

export interface CardDef {
  id: string;
  name: string;
  emoji: string;
  category: CardCategory;
  cost: CostType;
  activation: ActivationType;
  maxUses: number; // per round, 0 = passive
  description: string;
  vpValue: number;
  /** Shown in hover tooltip — concrete example or tip for tricky cards. */
  tooltipExample?: string;
  /** Installed network column: requirement (packets, timing, or “auto”). */
  networkReq?: string;
  /** Installed network column: outcome; omit from card UI if unset. */
  networkGives?: string;
}

export interface CardInstance {
  instanceId: string;
  defId: string;
  exhausted: boolean;
  usesThisRound: number;
}

export type GamePhase = 'start' | 'ready' | 'action' | 'end' | 'game-over';

export type GameMode = 'script_kiddie' | 'firewall_breach';

/** Firewall Breach: total XP must reach this after all operations are complete. */
export const FIREWALL_MIN_XP = 40;

export interface GameState {
  phase: GamePhase;
  gameMode: GameMode;
  round: number;
  maxRounds: number;
  mod: number;
  score: number;
  colony: CardInstance[];
  hand: CardInstance[];
  deck: string[];
  discardPile: string[];
  projects: CardInstance[];
  builtProjects: CardInstance[];
  dicePool: Die[];
  preservedDice: Die[];
  selectedDiceIds: string[];
  builtThisTurn: boolean;
  commandCenterUsedThisTurn: boolean;
  extraDiceNextRound: number;
  recyclingBonusNextRound: number;
  gameResult: 'win' | 'lose' | null;
  log: string[];
}
