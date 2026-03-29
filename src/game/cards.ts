import { CardDef } from './types';

export const CARD_DEFS: Record<string, CardDef> = {
  // === CORE SYSTEMS (Starting) ===
  main_terminal: {
    id: 'main_terminal', name: 'Main Terminal', emoji: '🖥️', category: 'basic',
    cost: { kind: 'none' }, activation: 'start-of-turn', maxUses: 0,
    description: 'Deploy 4 basic packets at the start of every cycle.', vpValue: 0,
    networkReq: 'Auto each cycle start (no click)',
    networkGives: '4 basic packets',
  },
  recon_hub: {
    id: 'recon_hub', name: 'Recon Hub', emoji: '📡', category: 'basic',
    cost: { kind: 'none' }, activation: 'click', maxUses: 2,
    description: 'Reroll all selected basic packets. Can be used TWICE per cycle.', vpValue: 0,
    networkReq: 'Click · select basic packets',
    networkGives: 'Reroll all selected basics (2× per cycle)',
  },
  code_lab: {
    id: 'code_lab', name: 'Code Lab', emoji: '💻', category: 'basic',
    cost: { kind: 'none' }, activation: 'click', maxUses: 1,
    description: 'Spend any pair of packets to pull a script card.', vpValue: 0,
    networkReq: 'A pair of packets',
    networkGives: 'A script card from the queue',
  },
  exploit_forge: {
    id: 'exploit_forge', name: 'Exploit Forge', emoji: '⚙️', category: 'basic',
    cost: { kind: 'none' }, activation: 'click', maxUses: 1,
    description: 'Spend three consecutive packets to gain a preserved Wildcard.', vpValue: 0,
    networkReq: 'Three consecutive values (e.g. 3-4-5)',
    networkGives: '1 preserved Wildcard',
  },

  // === NETWORK INFRASTRUCTURE ===
  network_node: {
    id: 'network_node', name: 'Network Node', emoji: '🔗', category: 'settlement',
    cost: { kind: 'four-in-a-row' }, activation: 'start-of-turn', maxUses: 0,
    description: 'Start of cycle: Deploy a basic packet.', vpValue: 1,
    networkReq: 'Auto each cycle start',
    networkGives: '+1 basic packet',
  },
  subnet: {
    id: 'subnet', name: 'Subnet', emoji: '🌐', category: 'settlement',
    cost: { kind: 'three-in-a-row' }, activation: 'start-of-turn', maxUses: 0,
    description: 'Start of even cycle: Deploy a basic packet.', vpValue: 1,
    networkReq: 'Auto on even cycles',
    networkGives: '+1 basic packet',
  },
  remote_server: {
    id: 'remote_server', name: 'Remote Server', emoji: '🗄️', category: 'settlement',
    cost: { kind: 'five-in-a-row' }, activation: 'start-of-turn', maxUses: 0,
    description: 'Start of cycle: Deploy 2 basic packets.', vpValue: 1,
    networkReq: 'Auto each cycle start',
    networkGives: '+2 basic packets',
  },

  // === BOTS ===
  bot_1: {
    id: 'bot_1', name: 'Bot v1', emoji: '🤖', category: 'drone',
    cost: { kind: 'specific', values: [1, 1, 1] }, activation: 'start-of-turn', maxUses: 0,
    description: 'Start of cycle: Gain a fixed 1.', vpValue: 1,
  },
  bot_2: {
    id: 'bot_2', name: 'Bot v2', emoji: '🤖', category: 'drone',
    cost: { kind: 'specific', values: [2, 2, 2] }, activation: 'start-of-turn', maxUses: 0,
    description: 'Start of cycle: Gain a fixed 2.', vpValue: 1,
  },
  bot_3: {
    id: 'bot_3', name: 'Bot v3', emoji: '🤖', category: 'drone',
    cost: { kind: 'specific', values: [3, 3, 3] }, activation: 'start-of-turn', maxUses: 0,
    description: 'Start of cycle: Gain a fixed 3.', vpValue: 1,
  },
  bot_4: {
    id: 'bot_4', name: 'Bot v4', emoji: '🤖', category: 'drone',
    cost: { kind: 'specific', values: [4, 4, 4] }, activation: 'start-of-turn', maxUses: 0,
    description: 'Start of cycle: Gain a fixed 4.', vpValue: 1,
  },
  bot_5: {
    id: 'bot_5', name: 'Bot v5', emoji: '🤖', category: 'drone',
    cost: { kind: 'specific', values: [5, 5, 5] }, activation: 'start-of-turn', maxUses: 0,
    description: 'Start of cycle: Gain a fixed 5.', vpValue: 1,
  },
  bot_6: {
    id: 'bot_6', name: 'Bot v6', emoji: '🤖', category: 'drone',
    cost: { kind: 'specific', values: [6, 6, 6] }, activation: 'start-of-turn', maxUses: 0,
    description: 'Start of cycle: Gain a fixed 6.', vpValue: 1,
  },

  // === HACKING TOOLS ===
  packet_injector: {
    id: 'packet_injector', name: 'Packet Injector', emoji: '💉', category: 'utility',
    cost: { kind: 'specific', values: [1, 2, 3] }, activation: 'click', maxUses: 1,
    description: 'Select a packet showing 1 → convert it to a Wildcard.', vpValue: 1,
    networkReq: 'Click · select a packet showing 1',
    networkGives: 'That packet becomes a Wildcard',
  },
  data_miner: {
    id: 'data_miner', name: 'Data Miner', emoji: '⛏️', category: 'utility',
    cost: { kind: 'specific', values: [4, 5, 6] }, activation: 'click', maxUses: 1,
    description: 'Select a pair → gain a Preserved Wildcard.', vpValue: 1,
    networkReq: 'Click · select a pair',
    networkGives: '1 preserved Wildcard',
  },
  port_scanner: {
    id: 'port_scanner', name: 'Port Scanner', emoji: '🔍', category: 'utility',
    cost: { kind: 'three-of-a-kind' }, activation: 'click', maxUses: 1,
    description: 'Deploy: +2 M.O.D. Click: Flip a 6→1 or 1→6.', vpValue: 1,
    networkReq: 'Click · select a 1 or a 6',
    networkGives: 'Flip to the opposite value (1↔6)',
  },
  sandbox: {
    id: 'sandbox', name: 'Sandbox', emoji: '🎯', category: 'utility',
    cost: { kind: 'two-pairs-in-a-row' }, activation: 'click', maxUses: 1,
    description: 'Select a packet → flip it (value becomes 7−X).', vpValue: 1,
    networkReq: 'Click · select one packet',
    networkGives: 'Value becomes 7 − X',
  },
  cold_storage: {
    id: 'cold_storage', name: 'Cold Storage', emoji: '🔐', category: 'utility',
    cost: { kind: 'specific', values: [1, 3, 5] }, activation: 'click', maxUses: 1,
    description: 'Select a packet → fix and preserve it.', vpValue: 1,
    networkReq: 'Click · select one packet',
    networkGives: 'Fix + move to cache (preserved)',
  },
  hash_core_16: {
    id: 'hash_core_16', name: 'Hash Core (16)', emoji: '🔢', category: 'utility',
    cost: { kind: 'sum', total: 16 }, activation: 'click', maxUses: 1,
    description: 'Select 2 packets → equally distribute their total value.', vpValue: 1,
    tooltipExample: 'e.g. 3+5=8 → two 4s. Odd totals split with floor/ceil (5+6=11 → 5 and 6).',
    networkReq: 'Click · select 2 packets',
    networkGives: 'Split their total evenly across two packets',
  },
  hash_core_20: {
    id: 'hash_core_20', name: 'Hash Core (20)', emoji: '🔢', category: 'utility',
    cost: { kind: 'sum', total: 20 }, activation: 'click', maxUses: 1,
    description: 'Select 1 packet → split into 2 packets of half value.', vpValue: 1,
    networkReq: 'Click · select 1 packet (value ≥2)',
    networkGives: 'Replace with two fixed packets (split value)',
  },
  hash_core_25: {
    id: 'hash_core_25', name: 'Hash Core (25)', emoji: '🔢', category: 'utility',
    cost: { kind: 'sum', total: 25 }, activation: 'click', maxUses: 1,
    description: 'Select 2 packets → produce 1 packet of sum (max 6) and +1.', vpValue: 1,
    networkReq: 'Click · select 2 packets',
    networkGives: 'Two new fixed packets from their sum (engine caps at 6)',
  },
  daemon: {
    id: 'daemon', name: 'Daemon', emoji: '👾', category: 'utility',
    cost: { kind: 'three-in-a-row' }, activation: 'click', maxUses: 1,
    description: 'Deploy: Roll a packet, fix and preserve it. Click: Reroll a basic or fixed packet.', vpValue: 1,
    networkReq: 'Click · select one basic or fixed packet',
    networkGives: 'Reroll that packet',
  },
  fork_process: {
    id: 'fork_process', name: 'Fork Process', emoji: '🔀', category: 'utility',
    cost: { kind: 'five-in-a-row' }, activation: 'click', maxUses: 1,
    description: 'Select a packet → generate a fixed copy.', vpValue: 1,
    networkReq: 'Click · select one packet',
    networkGives: 'A fixed copy of that value',
  },
  quantum_cipher: {
    id: 'quantum_cipher', name: 'Quantum Cipher', emoji: '🌀', category: 'utility',
    cost: { kind: 'two-pairs-in-a-row' }, activation: 'click', maxUses: 1,
    description: 'Reroll all selected basic packets.', vpValue: 1,
    networkReq: 'Click · select any basics',
    networkGives: 'Reroll all selected basics',
  },

  // === ADVANCED EXPLOITS ===
  replicator_agent: {
    id: 'replicator_agent', name: 'Replicator Agent', emoji: '🦾', category: 'advanced',
    cost: { kind: 'wild', count: 2 }, activation: 'start-of-turn', maxUses: 0,
    description: 'Start of cycle: Gain a Wildcard.', vpValue: 1,
    networkReq: 'Auto each cycle start',
    networkGives: '1 Wildcard',
  },
  failsafe_protocol: {
    id: 'failsafe_protocol', name: 'Failsafe Protocol', emoji: '📦', category: 'advanced',
    cost: { kind: 'three-of-a-kind' }, activation: 'end-of-turn', maxUses: 0,
    description: 'Deploy: Gain a preserved Wildcard. End of cycle: Gain a preserved Wildcard if no scripts deployed this cycle.', vpValue: 1,
    networkReq: 'Deploy once · end cycle with 0 script installs',
    networkGives: 'Preserved Wild on deploy; another at end if you skipped installs',
  },
  garbage_collector: {
    id: 'garbage_collector', name: 'Garbage Collector', emoji: '♻️', category: 'advanced',
    cost: { kind: 'three-of-a-kind' }, activation: 'conditional', maxUses: 0,
    description: 'When you spend a Wildcard, roll an extra packet next cycle.', vpValue: 1,
    tooltipExample: 'Triggers when a Wild is used to pay a cost or converted — watch the log for the bonus roll next cycle.',
    networkReq: 'Whenever you spend a Wildcard',
    networkGives: '+1 extra packet roll next cycle',
  },
  cyborg_unit: {
    id: 'cyborg_unit', name: 'Cyborg Unit', emoji: '🤖', category: 'advanced',
    cost: { kind: 'four-of-a-kind' }, activation: 'conditional', maxUses: 0,
    description: 'When rerolling exactly one packet, gain a basic packet.', vpValue: 1,
    networkReq: 'Reroll exactly one packet (e.g. Recon Hub)',
    networkGives: '+1 basic packet',
  },
  net_scanner: {
    id: 'net_scanner', name: 'Net Scanner', emoji: '🔭', category: 'advanced',
    cost: { kind: 'four-of-a-kind' }, activation: 'start-of-turn', maxUses: 0,
    description: 'Start of cycle: Roll a packet, fix and preserve it.', vpValue: 1,
    networkReq: 'Auto each cycle start',
    networkGives: 'Roll 1 · fix + preserve it',
  },
  zero_day: {
    id: 'zero_day', name: 'Zero-Day', emoji: '🧪', category: 'advanced',
    cost: { kind: 'three-in-a-row' }, activation: 'start-of-turn', maxUses: 0,
    description: 'Start of cycle: Gain a fixed packet of random value.', vpValue: 1,
    networkReq: 'Auto each cycle start',
    networkGives: '1 random fixed packet',
  },
  honeypot: {
    id: 'honeypot', name: 'Honeypot', emoji: '🍯', category: 'advanced',
    cost: { kind: 'specific', values: [1, 2, 3] }, activation: 'start-of-turn', maxUses: 0,
    description: 'Start of cycle: Roll 1 extra packet per operation completed.', vpValue: 1,
    networkReq: 'Auto each cycle start',
    networkGives: '+1 roll per completed operation (see Operations)',
  },
  dark_tunnel: {
    id: 'dark_tunnel', name: 'Dark Tunnel', emoji: '🕳️', category: 'advanced',
    cost: { kind: 'wild', count: 3 }, activation: 'start-of-turn', maxUses: 0,
    description: 'Start of cycle: Gain 2 Wildcards. End of cycle: +1 M.O.D.', vpValue: 1,
    networkReq: 'Auto at cycle start & end',
    networkGives: '2 Wildcards at start; +1 M.O.D. at end',
  },

  // === PASSIVE SYSTEMS ===
  odd_parity_filter: {
    id: 'odd_parity_filter', name: 'Odd Parity Filter', emoji: '🧲', category: 'passive',
    cost: { kind: 'specific', values: [1, 3, 5] }, activation: 'start-of-turn', maxUses: 0,
    description: 'Constraint: All other packets must be odd. Start of cycle: Gain a fixed odd packet.', vpValue: 1,
    tooltipExample:
      'No click — runs when each cycle starts. You gain one fixed odd (1, 3, or 5). The constraint line on the card applies to other basics in the pool.',
    networkReq: 'Standing rule: other basics must stay odd',
    networkGives: 'Each cycle start: fixed odd (1, 3, or 5)',
  },
  even_parity_filter: {
    id: 'even_parity_filter', name: 'Even Parity Filter', emoji: '🧲', category: 'passive',
    cost: { kind: 'specific', values: [2, 4, 6] }, activation: 'start-of-turn', maxUses: 0,
    description: 'Constraint: All other packets must be even. Start of cycle: Gain a fixed even packet.', vpValue: 1,
    tooltipExample:
      'No click — runs when each cycle starts. You gain one fixed even (2, 4, or 6). The constraint line on the card applies to other basics in the pool.',
    networkReq: 'Standing rule: other basics must stay even',
    networkGives: 'Each cycle start: fixed even (2, 4, or 6)',
  },
  packet_router: {
    id: 'packet_router', name: 'Packet Router', emoji: '📶', category: 'passive',
    cost: { kind: 'specific', values: [2, 4, 6] }, activation: 'start-of-turn', maxUses: 0,
    description: 'Start of cycle: +1 M.O.D.', vpValue: 1,
    networkReq: 'Auto each cycle start',
    networkGives: '+1 M.O.D.',
  },
  ids_probe: {
    id: 'ids_probe', name: 'IDS Probe', emoji: '👁️', category: 'passive',
    cost: { kind: 'specific', values: [4, 5, 6] }, activation: 'enter-play', maxUses: 0,
    description: 'Deploy: Pull a script. +1 M.O.D. when discarding a script.', vpValue: 1,
    networkReq: 'On deploy: cost paid · ongoing: right-click discard in Scripts',
    networkGives: 'Drew 1 script when installed; each discard +2 M.O.D. total (instead of +1)',
  },
  self_heal_protocol: {
    id: 'self_heal_protocol', name: 'Self-Heal Protocol', emoji: '🔄', category: 'passive',
    cost: { kind: 'four-of-a-kind' }, activation: 'end-of-turn', maxUses: 0,
    description: 'End of cycle: If no non-preserved packets remain, deploy 2 extra packets next cycle.', vpValue: 1,
    networkReq: 'End cycle with empty pool (no basics left)',
    networkGives: '+2 packet rolls next cycle',
  },
  power_manager: {
    id: 'power_manager', name: 'Power Manager', emoji: '🔋', category: 'passive',
    cost: { kind: 'four-of-a-kind' }, activation: 'end-of-turn', maxUses: 0,
    description: 'End of cycle: If 2+ unused packets remain (preserved count), deploy 2 extra packets next cycle.', vpValue: 1,
    networkReq: 'End with 2+ packets still in pool or cache',
    networkGives: '+2 packet rolls next cycle',
  },
  passive_tap: {
    id: 'passive_tap', name: 'Passive Tap', emoji: '⚡', category: 'passive',
    cost: { kind: 'specific', values: [2, 3, 4] }, activation: 'start-of-turn', maxUses: 0,
    description: 'Odd cycle: +1 M.O.D. Even cycle: Gain a fixed 3.', vpValue: 1,
    networkReq: 'Auto each cycle start (odd vs even)',
    networkGives: 'Odd cycle: +1 M.O.D. · Even: fixed 3',
  },
  arp_spoofer: {
    id: 'arp_spoofer', name: 'ARP Spoofer', emoji: '🌊', category: 'passive',
    cost: { kind: 'specific', values: [1, 6] }, activation: 'click', maxUses: 1,
    description: 'Select 2 packets → swap their values.', vpValue: 1,
    networkReq: 'Click · select 2 packets',
    networkGives: 'Swap their values',
  },

  // === OPERATIONS ===
  op_athena: {
    id: 'op_athena', name: 'OP_ATHENA', emoji: '🏛️', category: 'project',
    cost: { kind: 'wild', count: 4 }, activation: 'passive', maxUses: 0,
    description: 'Cost: 4 Wildcards.', vpValue: 1,
  },
  op_vishnu: {
    id: 'op_vishnu', name: 'OP_VISHNU', emoji: '🔱', category: 'project',
    cost: { kind: 'specific', values: [6, 6, 6, 6, 6, 6] }, activation: 'passive', maxUses: 0,
    description: 'Cost: Six 6s.', vpValue: 1,
  },
  op_inari: {
    id: 'op_inari', name: 'OP_INARI', emoji: '🦊', category: 'project',
    cost: { kind: 'specific', values: [1, 1, 1, 1, 1, 1] }, activation: 'passive', maxUses: 0,
    description: 'Cost: Six 1s. Wildcards set to 1 for free.', vpValue: 1,
  },
  op_pangu: {
    id: 'op_pangu', name: 'OP_PANGU', emoji: '🌍', category: 'project',
    cost: { kind: 'sum', total: 40 }, activation: 'passive', maxUses: 0,
    description: 'Cost: Packets summing to exactly 40.', vpValue: 1,
  },
  op_dazbog: {
    id: 'op_dazbog', name: 'OP_DAZBOG', emoji: '☀️', category: 'project',
    cost: { kind: 'seven-of-a-kind' }, activation: 'passive', maxUses: 0,
    description: 'Cost: Seven of a kind.', vpValue: 1,
  },
  op_quetzal: {
    id: 'op_quetzal', name: 'OP_QUETZAL', emoji: '🐉', category: 'project',
    cost: { kind: 'ten-same-parity', parity: 'either' }, activation: 'passive', maxUses: 0,
    description: 'Cost: 10 even OR 10 odd packets. Preserved packets count as 2.', vpValue: 1,
  },
  op_te_kore: {
    id: 'op_te_kore', name: 'OP_TE_KORE', emoji: '🌑', category: 'project',
    cost: { kind: 'two-sets-four-of-a-kind' }, activation: 'passive', maxUses: 0,
    description: 'Cost: Two sets of four of a kind (8 packets).', vpValue: 1,
  },
  op_herus: {
    id: 'op_herus', name: 'OP_HERUS', emoji: '⚡', category: 'project',
    cost: { kind: 'six-in-a-row' }, activation: 'passive', maxUses: 0,
    description: 'Cost: 1-2-3-4-5-6. Cannot execute if Recon Hub used this cycle.', vpValue: 1,
  },
  op_hesta: {
    id: 'op_hesta', name: 'OP_HESTA', emoji: '🔥', category: 'project',
    cost: { kind: 'two-triples' }, activation: 'passive', maxUses: 0,
    description: 'Cost: Two sets of 3 of a kind. Must deploy another script first this cycle.', vpValue: 1,
  },
  op_osiris: {
    id: 'op_osiris', name: 'OP_OSIRIS', emoji: '👁️', category: 'project',
    cost: { kind: 'five-pairs' }, activation: 'passive', maxUses: 0,
    description: 'Cost: Five pairs (10 packets).', vpValue: 1,
  },
  op_amaterasu: {
    id: 'op_amaterasu', name: 'OP_AMATERASU', emoji: '🌸', category: 'project',
    cost: { kind: 'sum', total: 21, exactCount: 6 }, activation: 'passive', maxUses: 0,
    description: 'Cost: Sum = 21 using exactly 6 packets.', vpValue: 1,
  },
  op_coyolx: {
    id: 'op_coyolx', name: 'OP_COYOLX', emoji: '🌙', category: 'project',
    cost: { kind: 'eight-alternating' }, activation: 'passive', maxUses: 0,
    description: 'Cost: 8 packets alternating odd/even pattern.', vpValue: 1,
  },
};

export const ALL_PROJECT_IDS = [
  'op_athena', 'op_vishnu', 'op_inari', 'op_pangu', 'op_dazbog', 'op_quetzal',
  'op_te_kore', 'op_herus', 'op_hesta', 'op_osiris', 'op_amaterasu', 'op_coyolx',
];

export const ALL_BLUEPRINT_IDS = Object.keys(CARD_DEFS).filter(
  id => CARD_DEFS[id].category !== 'basic' && CARD_DEFS[id].category !== 'project'
);

export const STARTING_BUILDINGS = ['main_terminal', 'recon_hub', 'code_lab', 'exploit_forge'];
