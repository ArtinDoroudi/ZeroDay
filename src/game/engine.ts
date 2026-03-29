import { GameState, CardInstance, Die, GameMode, FIREWALL_MIN_XP } from './types';
import { CARD_DEFS, ALL_BLUEPRINT_IDS, ALL_PROJECT_IDS, STARTING_BUILDINGS } from './cards';
import { genId, rollBasicDice, rollDie, createDie, shuffle, wrapDiceValue } from './utils';

function createCardInstance(defId: string): CardInstance {
  return { instanceId: genId(), defId, exhausted: false, usesThisRound: 0 };
}

export function initGame(mode: GameMode = 'script_kiddie'): GameState {
  const deck = shuffle(ALL_BLUEPRINT_IDS);
  const hand = deck.splice(0, 3).map(id => createCardInstance(id));
  const projects = shuffle(ALL_PROJECT_IDS).slice(0, 3).map(id => createCardInstance(id));
  const colony = STARTING_BUILDINGS.map(id => createCardInstance(id));

  return {
    phase: 'start',
    gameMode: mode,
    round: 0,
    maxRounds: 10,
    mod: 0,
    score: 0,
    colony,
    hand,
    deck,
    discardPile: [],
    projects,
    builtProjects: [],
    dicePool: [],
    preservedDice: [],
    selectedDiceIds: [],
    builtThisTurn: false,
    commandCenterUsedThisTurn: false,
    extraDiceNextRound: 0,
    recyclingBonusNextRound: 0,
    gameResult: null,
    log: [],
  };
}

function addLog(state: GameState, msg: string): GameState {
  return { ...state, log: [...state.log.slice(-49), msg] };
}

function isModeWin(s: GameState): boolean {
  if (s.projects.length > 0) return false;
  if (s.gameMode === 'firewall_breach') return s.score >= FIREWALL_MIN_XP;
  return true;
}

function drawCard(state: GameState): GameState {
  if (state.deck.length === 0) {
    if (state.discardPile.length === 0) return addLog(state, '📭 No cards to draw!');
    state = { ...state, deck: shuffle(state.discardPile), discardPile: [] };
    state = addLog(state, '🔄 Reshuffled discard pile into deck.');
  }
  const [cardId, ...rest] = state.deck;
  const inst = createCardInstance(cardId);
  return addLog({ ...state, deck: rest, hand: [...state.hand, inst] }, `📥 Drew ${CARD_DEFS[cardId].emoji} ${CARD_DEFS[cardId].name}`);
}

function hasColonyCard(state: GameState, defId: string): boolean {
  return state.colony.some(c => c.defId === defId);
}

function countBuiltProjects(state: GameState): number {
  return state.builtProjects.length;
}

export function startReadyPhase(state: GameState): GameState {
  let s: GameState = { ...state, round: state.round + 1, phase: 'ready', builtThisTurn: false, commandCenterUsedThisTurn: false };
  s = addLog(s, `\n━━━ CYCLE ${s.round} ━━━`);

  // Reset exhausted
  s = { ...s, colony: s.colony.map(c => ({ ...c, exhausted: false, usesThisRound: 0 })) };

  // Roll HQ dice (4 + extras)
  let extraDice = 4 + s.extraDiceNextRound + s.recyclingBonusNextRound;
  s = { ...s, extraDiceNextRound: 0, recyclingBonusNextRound: 0 };

  const newDice = rollBasicDice(extraDice);
  s = { ...s, dicePool: [...s.dicePool, ...newDice] };
  s = addLog(s, `📡 Deployed ${extraDice} basic packets: [${newDice.map(d => d.value).join(', ')}]`);

  // Draw 1 card
  s = drawCard(s);

  // Start-of-turn abilities
  for (const card of s.colony) {
    const def = CARD_DEFS[card.defId];
    if (def.activation !== 'start-of-turn' || def.id === 'main_terminal') continue;

    switch (def.id) {
      case 'network_node': {
        const d = rollBasicDice(1);
        s = { ...s, dicePool: [...s.dicePool, ...d] };
        s = addLog(s, `🔗 Network Node deployed: ${d[0].value}`);
        break;
      }
      case 'subnet': {
        if (s.round % 2 === 0) {
          const d = rollBasicDice(1);
          s = { ...s, dicePool: [...s.dicePool, ...d] };
          s = addLog(s, `🌐 Subnet deployed: ${d[0].value}`);
        }
        break;
      }
      case 'remote_server': {
        const d = rollBasicDice(2);
        s = { ...s, dicePool: [...s.dicePool, ...d] };
        s = addLog(s, `🗄️ Remote Server deployed: ${d.map(x => x.value).join(', ')}`);
        break;
      }
      case 'bot_1': case 'bot_2': case 'bot_3':
      case 'bot_4': case 'bot_5': case 'bot_6': {
        const val = parseInt(def.id.split('_')[1]);
        s = { ...s, dicePool: [...s.dicePool, createDie(val, 'fixed')] };
        s = addLog(s, `🤖 ${def.name} generated fixed ${val}`);
        break;
      }
      case 'replicator_agent': {
        const d = createDie(rollDie(), 'wild');
        s = { ...s, dicePool: [...s.dicePool, d] };
        s = addLog(s, `🦾 Replicator Agent created Wildcard: ${d.value}`);
        break;
      }
      case 'net_scanner': {
        const d = createDie(rollDie(), 'fixed', true);
        s = { ...s, preservedDice: [...s.preservedDice, d] };
        s = addLog(s, `🔭 Net Scanner preserved fixed ${d.value}`);
        break;
      }
      case 'zero_day': {
        const d = createDie(rollDie(), 'fixed');
        s = { ...s, dicePool: [...s.dicePool, d] };
        s = addLog(s, `🧪 Zero-Day generated fixed ${d.value}`);
        break;
      }
      case 'honeypot': {
        const count = countBuiltProjects(s);
        if (count > 0) {
          const dice = rollBasicDice(count);
          s = { ...s, dicePool: [...s.dicePool, ...dice] };
          s = addLog(s, `🍯 Honeypot lured ${count} packets`);
        }
        break;
      }
      case 'dark_tunnel': {
        const d1 = createDie(rollDie(), 'wild');
        const d2 = createDie(rollDie(), 'wild');
        s = { ...s, dicePool: [...s.dicePool, d1, d2] };
        s = addLog(s, `🕳️ Dark Tunnel generated 2 Wildcards`);
        break;
      }
      case 'packet_router': {
        s = { ...s, mod: s.mod + 1 };
        s = addLog(s, `📶 Packet Router: +1 M.O.D. (total: ${s.mod})`);
        break;
      }
      case 'odd_parity_filter': {
        const vals = [1, 3, 5];
        const v = vals[Math.floor(Math.random() * 3)];
        s = { ...s, dicePool: [...s.dicePool, createDie(v, 'fixed')] };
        s = addLog(s, `🧲 Odd Parity Filter generated fixed ${v}`);
        break;
      }
      case 'even_parity_filter': {
        const vals = [2, 4, 6];
        const v = vals[Math.floor(Math.random() * 3)];
        s = { ...s, dicePool: [...s.dicePool, createDie(v, 'fixed')] };
        s = addLog(s, `🧲 Even Parity Filter generated fixed ${v}`);
        break;
      }
      case 'passive_tap': {
        if (s.round % 2 === 1) {
          s = { ...s, mod: s.mod + 1 };
          s = addLog(s, `⚡ Passive Tap: +1 M.O.D.`);
        } else {
          s = { ...s, dicePool: [...s.dicePool, createDie(3, 'fixed')] };
          s = addLog(s, `⚡ Passive Tap: gained fixed 3`);
        }
        break;
      }
    }
  }

  s = { ...s, phase: 'action' };
  s = addLog(s, '⚡ ACTIVE — execute your attacks!');
  return s;
}

function getSelectedDice(state: GameState): Die[] {
  const allDice = [...state.dicePool, ...state.preservedDice];
  return allDice.filter(d => state.selectedDiceIds.includes(d.id));
}

export function toggleDieSelection(state: GameState, dieId: string): GameState {
  if (state.selectedDiceIds.includes(dieId)) {
    return { ...state, selectedDiceIds: state.selectedDiceIds.filter(id => id !== dieId) };
  }
  return { ...state, selectedDiceIds: [...state.selectedDiceIds, dieId] };
}

export function exclusiveSelectDie(state: GameState, dieId: string): GameState {
  return { ...state, selectedDiceIds: [dieId] };
}

export function modifyDie(state: GameState, dieId: string, delta: number): GameState {
  const allDice = [...state.dicePool, ...state.preservedDice];
  const die = allDice.find(d => d.id === dieId);
  if (!die) return state;
  
  const isWild = die.type === 'wild';
  if (!isWild && state.mod <= 0) return addLog(state, '❌ No M.O.D. remaining!');

  const newValue = wrapDiceValue(die.value, delta);
  const updateDie = (d: Die) => d.id === dieId ? { ...d, value: newValue } : d;
  
  let s = {
    ...state,
    mod: isWild ? state.mod : state.mod - 1,
    dicePool: state.dicePool.map(updateDie),
    preservedDice: state.preservedDice.map(updateDie),
  };
  return addLog(s, `🔧 Modified die: ${die.value} → ${newValue}${isWild ? ' (free - wild)' : ` (M.O.D.: ${s.mod})`}`);
}

function removeDiceFromPools(state: GameState, diceIds: string[]): GameState {
  return {
    ...state,
    dicePool: state.dicePool.filter(d => !diceIds.includes(d.id)),
    preservedDice: state.preservedDice.filter(d => !diceIds.includes(d.id)),
    selectedDiceIds: state.selectedDiceIds.filter(id => !diceIds.includes(id)),
  };
}

function countWildSpent(dice: Die[]): number {
  return dice.filter(d => d.type === 'wild').length;
}

export function canPayCost(state: GameState, defId: string): boolean {
  const def = CARD_DEFS[defId];
  const selected = getSelectedDice(state);
  return checkCostMatch(def.cost, selected, state);
}

function checkCostMatch(cost: any, selected: Die[], state: GameState): boolean {
  const values = selected.map(d => d.value).sort((a, b) => a - b);
  
  switch (cost.kind) {
    case 'none': return false;
    case 'specific': {
      const needed = [...cost.values].sort((a, b) => a - b);
      if (values.length !== needed.length) return false;
      // Wild dice can match any value
      const remaining = [...needed];
      const nonWild = selected.filter(d => d.type !== 'wild');
      const wildCount = selected.filter(d => d.type === 'wild').length;
      let unmatched = 0;
      for (const d of nonWild) {
        const idx = remaining.indexOf(d.value);
        if (idx >= 0) remaining.splice(idx, 1);
        else unmatched++;
      }
      return unmatched <= 0 && remaining.length <= wildCount;
    }
    case 'three-in-a-row': return isConsecutive(values, 3, selected);
    case 'four-in-a-row': return isConsecutive(values, 4, selected);
    case 'five-in-a-row': return isConsecutive(values, 5, selected);
    case 'six-in-a-row': return values.length === 6 && isConsecutive(values, 6, selected);
    case 'three-of-a-kind': return values.length === 3 && isNOfAKind(values, 3, selected);
    case 'four-of-a-kind': return values.length === 4 && isNOfAKind(values, 4, selected);
    case 'seven-of-a-kind': return values.length === 7 && isNOfAKind(values, 7, selected);
    case 'pair': return values.length === 2 && (values[0] === values[1] || selected.some(d => d.type === 'wild'));
    case 'wild': return selected.length === cost.count && selected.every(d => d.type === 'wild');
    case 'sum': {
      const sum = values.reduce((a, b) => a + b, 0);
      if (cost.exactCount && selected.length !== cost.exactCount) return false;
      return sum === cost.total;
    }
    case 'two-pairs-in-a-row': {
      // e.g. 2,2,3,3 or 4,4,5,5
      if (values.length !== 4) return false;
      return (values[0] === values[1] && values[2] === values[3] && values[2] - values[0] === 1);
    }
    case 'two-sets-four-of-a-kind': {
      if (values.length !== 8) return false;
      const groups = groupByValue(values);
      const counts = Object.values(groups).sort((a, b) => b - a);
      return counts.length >= 2 && counts[0] >= 4 && counts[1] >= 4;
    }
    case 'two-triples': {
      if (values.length !== 6) return false;
      const groups = groupByValue(values);
      const counts = Object.values(groups).sort((a, b) => b - a);
      return counts.length >= 2 && counts[0] >= 3 && counts[1] >= 3;
    }
    case 'five-pairs': {
      if (values.length !== 10) return false;
      const groups = groupByValue(values);
      let pairs = 0;
      for (const c of Object.values(groups)) pairs += Math.floor(c / 2);
      return pairs >= 5;
    }
    case 'ten-same-parity': {
      // Preserved dice count as 2
      let effectiveCount = 0;
      const checkOdd = selected.every(d => d.value % 2 === 1);
      const checkEven = selected.every(d => d.value % 2 === 0);
      if (!checkOdd && !checkEven) return false;
      for (const d of selected) {
        effectiveCount += d.preserved ? 2 : 1;
      }
      return effectiveCount >= 10;
    }
    case 'eight-alternating': {
      if (selected.length !== 8) return false;
      for (let i = 1; i < values.length; i++) {
        if (values[i] % 2 === values[i - 1] % 2) return false;
      }
      return true;
    }
    default: return false;
  }
}

function groupByValue(values: number[]): Record<number, number> {
  const g: Record<number, number> = {};
  for (const v of values) g[v] = (g[v] || 0) + 1;
  return g;
}

function isConsecutive(sorted: number[], len: number, selected: Die[]): boolean {
  if (sorted.length !== len) return false;
  // Simple check: sorted values form a consecutive sequence
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] !== 1) return false;
  }
  return true;
}

function isNOfAKind(values: number[], n: number, selected: Die[]): boolean {
  if (values.length !== n) return false;
  const wildCount = selected.filter(d => d.type === 'wild').length;
  const groups = groupByValue(values);
  const maxGroup = Math.max(...Object.values(groups));
  return maxGroup + wildCount >= n || (wildCount > 0 && Object.values(groups).some(c => c + wildCount >= n));
}

export function activateBuilding(state: GameState, cardInstanceId: string): GameState {
  const card = state.colony.find(c => c.instanceId === cardInstanceId);
  if (!card) return state;
  const def = CARD_DEFS[card.defId];
  if (card.exhausted && def.id !== 'recon_hub') return addLog(state, '❌ Building already exhausted!');
  if (card.usesThisRound >= def.maxUses && def.maxUses > 0) return addLog(state, '❌ No more uses this round!');

  const selected = getSelectedDice(state);
  let s = state;

  switch (def.id) {
    case 'recon_hub': {
      if (card.usesThisRound >= 2) return addLog(s, '❌ Recon Hub already used twice!');
      const basicSelected = selected.filter(d => d.type === 'basic');
      if (basicSelected.length === 0) return addLog(s, '❌ Select basic dice to reroll!');
      const newDice = basicSelected.map(d => ({ ...d, value: rollDie() }));
      const ids = basicSelected.map(d => d.id);
      s = {
        ...s,
        dicePool: s.dicePool.map(d => ids.includes(d.id) ? newDice.find(n => n.id === d.id)! : d),
        preservedDice: s.preservedDice.map(d => ids.includes(d.id) ? newDice.find(n => n.id === d.id)! : d),
        commandCenterUsedThisTurn: true,
      };
      // Bionic Robot check
      if (basicSelected.length === 1 && hasColonyCard(s, 'cyborg_unit')) {
        const bonus = rollBasicDice(1);
        s = { ...s, dicePool: [...s.dicePool, ...bonus] };
        s = addLog(s, `🤖 Cyborg Unit: gained extra packet ${bonus[0].value}`);
      }
      s = addLog(s, `🎛️ Recon Hub rerolled ${basicSelected.length} packets: [${newDice.map(d => d.value).join(', ')}]`);
      break;
    }
    case 'code_lab': {
      if (selected.length !== 2 || selected[0].value !== selected[1].value) {
        if (selected.length !== 2 || !selected.some(d => d.type === 'wild')) {
          return addLog(s, '❌ Select a pair of matching dice!');
        }
      }
      s = removeDiceFromPools(s, selected.map(d => d.id));
      s = drawCard(s);
      s = addLog(s, `💻 Code Lab: spent pair, pulled a script.`);
      break;
    }
    case 'exploit_forge': {
      if (selected.length !== 3) return addLog(s, '❌ Select exactly 3 consecutive dice!');
      const vals = selected.map(d => d.value).sort((a, b) => a - b);
      if (!isConsecutive(vals, 3, selected)) return addLog(s, '❌ Dice must be consecutive!');
      s = removeDiceFromPools(s, selected.map(d => d.id));
      const wildDie = createDie(rollDie(), 'wild', true);
      s = { ...s, preservedDice: [...s.preservedDice, wildDie] };
      // Recycling check
      const wildsSpent = countWildSpent(selected);
      if (hasColonyCard(s, 'garbage_collector')) {
        s = { ...s, recyclingBonusNextRound: s.recyclingBonusNextRound + wildsSpent };
      }
      s = addLog(s, `⚙️ Exploit Forge: created preserved Wildcard (${wildDie.value})`);
      break;
    }
    case 'packet_injector': {
      if (selected.length !== 1 || selected[0].value !== 1) return addLog(s, '❌ Select a die showing 1!');
      const dieId = selected[0].id;
      s = {
        ...s,
        dicePool: s.dicePool.map(d => d.id === dieId ? { ...d, type: 'wild' as const } : d),
        preservedDice: s.preservedDice.map(d => d.id === dieId ? { ...d, type: 'wild' as const } : d),
      };
      s = addLog(s, `💉 Packet Injector: converted packet to Wildcard!`);
      break;
    }
    case 'data_miner': {
      if (selected.length !== 2 || (selected[0].value !== selected[1].value && !selected.some(d => d.type === 'wild'))) {
        return addLog(s, '❌ Select a pair!');
      }
      s = removeDiceFromPools(s, selected.map(d => d.id));
      const wildDie = createDie(rollDie(), 'wild', true);
      s = { ...s, preservedDice: [...s.preservedDice, wildDie] };
      const wildsSpent = countWildSpent(selected);
      if (hasColonyCard(s, 'garbage_collector')) {
        s = { ...s, recyclingBonusNextRound: s.recyclingBonusNextRound + wildsSpent };
      }
      s = addLog(s, `⛏️ Data Miner: gained preserved Wildcard!`);
      break;
    }
    case 'port_scanner': {
      if (selected.length !== 1) return addLog(s, '❌ Select one die!');
      const die = selected[0];
      if (die.value !== 1 && die.value !== 6) return addLog(s, '❌ Die must be 1 or 6!');
      const newVal = die.value === 6 ? 1 : 6;
      const updateDie = (d: Die) => d.id === die.id ? { ...d, value: newVal } : d;
      s = { ...s, dicePool: s.dicePool.map(updateDie), preservedDice: s.preservedDice.map(updateDie) };
      s = addLog(s, `🔍 Port Scanner: ${die.value} → ${newVal}`);
      break;
    }
    case 'sandbox': {
      if (selected.length !== 1) return addLog(s, '❌ Select one die!');
      const die = selected[0];
      const newVal = 7 - die.value;
      const updateDie = (d: Die) => d.id === die.id ? { ...d, value: newVal } : d;
      s = { ...s, dicePool: s.dicePool.map(updateDie), preservedDice: s.preservedDice.map(updateDie) };
      s = addLog(s, `🎯 Sandbox: ${die.value} → ${newVal}`);
      break;
    }
    case 'cold_storage': {
      if (selected.length !== 1) return addLog(s, '❌ Select one die!');
      const die = selected[0];
      const preserved: Die = { ...die, type: 'fixed', preserved: true };
      s = removeDiceFromPools(s, [die.id]);
      s = { ...s, preservedDice: [...s.preservedDice, preserved], selectedDiceIds: [] };
      s = addLog(s, `🔐 Cold Storage: fixed and preserved packet (${die.value})`);
      break;
    }
    case 'hash_core_16': {
      if (selected.length !== 2) return addLog(s, '❌ Select exactly 2 dice!');
      const sum = selected[0].value + selected[1].value;
      const half = Math.floor(sum / 2);
      const updateDie = (d: Die) => {
        if (d.id === selected[0].id) return { ...d, value: half };
        if (d.id === selected[1].id) return { ...d, value: sum - half };
        return d;
      };
      s = { ...s, dicePool: s.dicePool.map(updateDie), preservedDice: s.preservedDice.map(updateDie) };
      s = addLog(s, `🔢 Hash Core (16): distributed ${sum} → ${half} + ${sum - half}`);
      break;
    }
    case 'hash_core_20': {
      if (selected.length !== 1) return addLog(s, '❌ Select exactly 1 die!');
      const val = selected[0].value;
      if (val < 2) return addLog(s, '❌ Cannot split a 1!');
      const half = Math.floor(val / 2);
      s = removeDiceFromPools(s, [selected[0].id]);
      s = { ...s, dicePool: [...s.dicePool, createDie(half, 'fixed'), createDie(val - half, 'fixed')] };
      s = addLog(s, `🔢 Hash Core (20): split ${val} → ${half} + ${val - half}`);
      break;
    }
    case 'hash_core_25': {
      if (selected.length !== 2) return addLog(s, '❌ Select exactly 2 dice!');
      const sum = selected[0].value + selected[1].value;
      const v1 = Math.min(sum, 6);
      const v2 = Math.min(v1 + 1, 6);
      s = removeDiceFromPools(s, selected.map(d => d.id));
      s = { ...s, dicePool: [...s.dicePool, createDie(v1, 'fixed'), createDie(v2, 'fixed')] };
      s = addLog(s, `🔢 Hash Core (25): ${sum} → ${v1} + ${v2}`);
      break;
    }
    case 'daemon': {
      if (selected.length !== 1) return addLog(s, '❌ Select one die to reroll!');
      const die = selected[0];
      if (die.type === 'wild') return addLog(s, '❌ Cannot reroll wild dice!');
      const newVal = rollDie();
      const updateDie = (d: Die) => d.id === die.id ? { ...d, value: newVal } : d;
      s = { ...s, dicePool: s.dicePool.map(updateDie), preservedDice: s.preservedDice.map(updateDie) };
      if (hasColonyCard(s, 'cyborg_unit')) {
        const bonus = rollBasicDice(1);
        s = { ...s, dicePool: [...s.dicePool, ...bonus] };
        s = addLog(s, `🤖 Cyborg Unit: gained extra packet ${bonus[0].value}`);
      }
      s = addLog(s, `👾 Daemon: rerolled → ${newVal}`);
      break;
    }
    case 'fork_process': {
      if (selected.length !== 1) return addLog(s, '❌ Select one die to clone!');
      const die = selected[0];
      const clone = createDie(die.value, 'fixed');
      s = { ...s, dicePool: [...s.dicePool, clone] };
      s = addLog(s, `🔀 Fork Process: created copy of ${die.value}`);
      break;
    }
    case 'quantum_cipher': {
      const basicSelected = selected.filter(d => d.type === 'basic');
      if (basicSelected.length === 0) return addLog(s, '❌ Select basic dice to reroll!');
      const newDice = basicSelected.map(d => ({ ...d, value: rollDie() }));
      const ids = basicSelected.map(d => d.id);
      s = { ...s, dicePool: s.dicePool.map(d => ids.includes(d.id) ? newDice.find(n => n.id === d.id)! : d) };
      if (basicSelected.length === 1 && hasColonyCard(s, 'cyborg_unit')) {
        const bonus = rollBasicDice(1);
        s = { ...s, dicePool: [...s.dicePool, ...bonus] };
        s = addLog(s, `🤖 Cyborg Unit: gained extra packet ${bonus[0].value}`);
      }
      s = addLog(s, `🌀 Quantum Cipher: rerolled → [${newDice.map(d => d.value).join(', ')}]`);
      break;
    }
    case 'arp_spoofer': {
      if (selected.length !== 2) return addLog(s, '❌ Select exactly 2 dice to swap!');
      const [d1, d2] = selected;
      const updateDie = (d: Die) => {
        if (d.id === d1.id) return { ...d, value: d2.value };
        if (d.id === d2.id) return { ...d, value: d1.value };
        return d;
      };
      s = { ...s, dicePool: s.dicePool.map(updateDie), preservedDice: s.preservedDice.map(updateDie) };
      s = addLog(s, `🌊 ARP Spoofer: swapped ${d1.value} ↔ ${d2.value}`);
      break;
    }
    default:
      return addLog(s, `❌ ${def.name} has no click activation.`);
  }

  // Mark used
  s = {
    ...s,
    colony: s.colony.map(c =>
      c.instanceId === cardInstanceId
        ? { ...c, usesThisRound: c.usesThisRound + 1, exhausted: c.usesThisRound + 1 >= def.maxUses }
        : c
    ),
  };

  return s;
}

export function buildCard(state: GameState, cardInstanceId: string, isProject: boolean): GameState {
  const source = isProject ? state.projects : state.hand;
  const card = source.find(c => c.instanceId === cardInstanceId);
  if (!card) return state;
  const def = CARD_DEFS[card.defId];

  // Special project constraints
  if (def.id === 'op_herus' && state.commandCenterUsedThisTurn) {
    return addLog(state, '❌ Cannot execute OP_HERUS after using Recon Hub this turn!');
  }
  if (def.id === 'op_hesta' && !state.builtThisTurn) {
    return addLog(state, '❌ Must deploy another script first this turn to execute OP_HESTA!');
  }

  const selected = getSelectedDice(state);
  if (!checkCostMatch(def.cost, selected, state)) {
    return addLog(state, `❌ Selected dice don't match the cost of ${def.name}!`);
  }

  // Consume dice
  const wildsSpent = countWildSpent(selected);
  let s = removeDiceFromPools(state, selected.map(d => d.id));

  // Recycling check
  if (hasColonyCard(s, 'garbage_collector') && wildsSpent > 0) {
    s = { ...s, recyclingBonusNextRound: s.recyclingBonusNextRound + wildsSpent };
    s = addLog(s, `♻️ Garbage Collector: +${wildsSpent} extra packets next cycle`);
  }

  if (isProject) {
    const timeBonus = 3 * (11 - s.round);
    const vpGained = def.vpValue + timeBonus;
    s = {
      ...s,
      projects: s.projects.filter(c => c.instanceId !== cardInstanceId),
      builtProjects: [...s.builtProjects, card],
      score: s.score + vpGained,
      builtThisTurn: true,
    };
    s = addLog(s, `🎯 Executed ${def.emoji} ${def.name}! +${vpGained} XP (${def.vpValue} + ${timeBonus} time bonus)`);

    if (s.projects.length === 0) {
      if (isModeWin(s)) {
        s = { ...s, phase: 'game-over', gameResult: 'win' };
        s =
          s.gameMode === 'firewall_breach'
            ? addLog(s, `🎉 FIREWALL BREACHED! ${FIREWALL_MIN_XP}+ XP — You WIN with ${s.score} XP!`)
            : addLog(s, `🎉 ALL OPERATIONS COMPLETE! You WIN with ${s.score} XP!`);
      } else {
        s = addLog(
          s,
          `🔓 All operations executed — breach requires ${FIREWALL_MIN_XP}+ XP total. Deploy scripts to raise your score.`
        );
      }
    }
  } else {
    s = {
      ...s,
      hand: s.hand.filter(c => c.instanceId !== cardInstanceId),
      colony: [...s.colony, { ...card, exhausted: true, usesThisRound: 0 }],
      score: s.score + def.vpValue,
      builtThisTurn: true,
    };
    s = addLog(s, `💾 Deployed ${def.emoji} ${def.name}! +${def.vpValue} XP`);

    // Enter-play effects
    switch (def.id) {
      case 'port_scanner':
        s = { ...s, mod: s.mod + 2 };
        s = addLog(s, `🔍 Port Scanner deployed: +2 M.O.D.`);
        break;
      case 'daemon': {
        const d = createDie(rollDie(), 'fixed', true);
        s = { ...s, preservedDice: [...s.preservedDice, d] };
        s = addLog(s, `👾 Daemon deployed: preserved fixed ${d.value}`);
        break;
      }
      case 'failsafe_protocol': {
        const d = createDie(rollDie(), 'wild', true);
        s = { ...s, preservedDice: [...s.preservedDice, d] };
        s = addLog(s, `📦 Failsafe Protocol deployed: preserved Wildcard ${d.value}`);
        break;
      }
      case 'ids_probe':
        s = drawCard(s);
        s = addLog(s, `👁️ IDS Probe deployed: pulled a script`);
        break;
    }

    if (s.gameMode === 'firewall_breach' && s.projects.length === 0 && s.score >= FIREWALL_MIN_XP) {
      s = { ...s, phase: 'game-over', gameResult: 'win' };
      s = addLog(s, `🎉 FIREWALL BREACHED! ${FIREWALL_MIN_XP}+ XP — You WIN with ${s.score} XP!`);
    }
  }

  return s;
}

export function discardForMod(state: GameState, cardInstanceId: string): GameState {
  const card = state.hand.find(c => c.instanceId === cardInstanceId);
  if (!card) return state;
  const def = CARD_DEFS[card.defId];

  let modGain = 1;
  if (hasColonyCard(state, 'ids_probe')) modGain += 1;

  let s = {
    ...state,
    hand: state.hand.filter(c => c.instanceId !== cardInstanceId),
    discardPile: [...state.discardPile, card.defId],
    mod: state.mod + modGain,
  };
  s = addLog(s, `🗑️ Discarded ${def.emoji} ${def.name} for +${modGain} M.O.D. (total: ${s.mod})`);
  return s;
}

/** Full new run (same mode): random operations, shuffled script deck + hand, fresh packets, score reset. */
export function resetHand(state: GameState): GameState {
  if (state.phase === 'game-over' || state.phase === 'start') return state;
  let s = initGame(state.gameMode);
  s = addLog(s, '🔁 New run — fresh operations, deck, and packets.');
  return startReadyPhase(s);
}

export function endTurn(state: GameState): GameState {
  let s: GameState = { ...state, phase: 'end' };
  s = addLog(s, '🔚 End Phase');

  // End-of-turn abilities
  for (const card of s.colony) {
    const def = CARD_DEFS[card.defId];
    switch (def.id) {
      case 'failsafe_protocol': {
        if (!s.builtThisTurn) {
          const d = createDie(rollDie(), 'wild', true);
          s = { ...s, preservedDice: [...s.preservedDice, d] };
          s = addLog(s, `📦 Failsafe Protocol: no deploys → preserved Wildcard ${d.value}`);
        }
        break;
      }
      case 'dark_tunnel': {
        s = { ...s, mod: s.mod + 1 };
        s = addLog(s, `🕳️ Dark Tunnel: +1 M.O.D.`);
        break;
      }
      case 'self_heal_protocol': {
        if (s.dicePool.length === 0 && s.preservedDice.length === 0) {
          s = { ...s, extraDiceNextRound: s.extraDiceNextRound + 2 };
          s = addLog(s, `🔄 Self-Heal Protocol: +2 extra packets next cycle`);
        }
        break;
      }
      case 'power_manager': {
        const totalUnused = s.dicePool.length + s.preservedDice.length;
        if (totalUnused >= 2) {
          s = { ...s, extraDiceNextRound: s.extraDiceNextRound + 2 };
          s = addLog(s, `🔋 Power Manager: +2 extra packets next cycle`);
        }
        break;
      }
    }
  }

  // Discard non-preserved dice
  s = { ...s, dicePool: [], selectedDiceIds: [] };

  if (s.round >= s.maxRounds) {
    if (isModeWin(s)) {
      s = { ...s, phase: 'game-over', gameResult: 'win' };
      s =
        s.gameMode === 'firewall_breach'
          ? addLog(s, `🎉 FIREWALL BREACHED! ${FIREWALL_MIN_XP}+ XP — You WIN with ${s.score} XP!`)
          : addLog(s, `🎉 ALL OPERATIONS COMPLETE! You WIN with ${s.score} XP!`);
      return s;
    }
    s = { ...s, phase: 'game-over', gameResult: 'lose' };
    if (s.gameMode === 'firewall_breach') {
      if (s.projects.length > 0) {
        s = addLog(s, `💀 Cycle ${s.maxRounds} ended. Breach failed — operations unfinished or under ${FIREWALL_MIN_XP} XP.`);
      } else {
        s = addLog(s, `💀 Cycle ${s.maxRounds} ended. Breach failed — need ${FIREWALL_MIN_XP}+ XP (have ${s.score}).`);
      }
    } else {
      s = addLog(s, `💀 Cycle ${s.maxRounds} ended. Operations failed. You LOSE!`);
    }
    return s;
  }

  return startReadyPhase(s);
}

export function calculateScore(state: GameState): { total: number; breakdown: { label: string; vp: number }[] } {
  const breakdown: { label: string; vp: number }[] = [];
  for (const c of state.colony) {
    const def = CARD_DEFS[c.defId];
    if (def.vpValue > 0) breakdown.push({ label: `${def.emoji} ${def.name}`, vp: def.vpValue });
  }
  for (const c of state.builtProjects) {
    const def = CARD_DEFS[c.defId];
    breakdown.push({ label: `${def.emoji} ${def.name}`, vp: def.vpValue });
  }
  return { total: state.score, breakdown };
}
