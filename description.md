# Solo Deck Quest — reference description

In code, each card’s **`id`** string is identical to its **`CARD_DEFS` record key** and to **`CardInstance.defId`** everywhere (deck, hand, colony, projects). Ids use **snake_case** aligned with the in-game **display names** (cyber / ops theme), not legacy keys like `shuttle` or `headquarter`.

---

## Operations (`category: project`)

**Goal:** Execute all **three** operations drawn at game start before **cycle 10** ends.

**How to execute:** Select packets whose faces match the operation’s **cost**, satisfy any **extra rules**, then click the operation card. Selected packets are **removed** from the pool.

**Power (score):** Each execution grants **`vpValue` (always 1) + time bonus** where **time bonus = `3 × (11 − current cycle)`**. Earlier clears yield much more XP. Clearing the **last** operation ends the game in a **win**.

| `id` | Display name | Emoji | Cost to execute | What it does | Extra rules |
| --- | --- | :---: | --- | --- | --- |
| `op_athena` | OP_ATHENA | 🏛️ | Exactly **4 Wildcard** packets (`wild` type only). | Removes the operation; awards XP as above. | — |
| `op_vishnu` | OP_VISHNU | 🔱 | **Six** dice all showing **6** (wilds count toward the six-of-a-kind). | Same. | — |
| `op_inari` | OP_INARI | 🦊 | **Six** dice all showing **1**. | Same. | — |
| `op_pangu` | OP_PANGU | 🌍 | Any number of dice with **sum exactly 40**. | Same. | — |
| `op_dazbog` | OP_DAZBOG | ☀️ | **Seven of a kind** (wilds help). | Same. | — |
| `op_quetzal` | OP_QUETZAL | 🐉 | **10 effective** dice, all **even** or all **odd**; **preserved** dice count **double** toward 10. | Same. | — |
| `op_te_kore` | OP_TE_KORE | 🌑 | **8** dice forming **two separate four-of-a-kinds**. | Same. | — |
| `op_herus` | OP_HERUS | ⚡ | **1–2–3–4–5–6** (six consecutive values). | Same. | **Blocked** if **Recon Hub** (`recon_hub`) was used this cycle (`commandCenterUsedThisTurn`). |
| `op_hesta` | OP_HESTA | 🔥 | **Two triples** (six dice, two values ×3 each; wilds help). | Same. | You must **deploy a script** (non-operation) **earlier the same cycle** (`builtThisTurn` already true). |
| `op_osiris` | OP_OSIRIS | 👁️ | **Five pairs** (10 dice; wilds help). | Same. | — |
| `op_amaterasu` | OP_AMATERASU | 🌸 | **Exactly 6** dice with **sum 21**. | Same. | — |
| `op_coyolx` | OP_COYOLX | 🌙 | **8** dice; after **sorting** values, each step must **alternate odd/even** parity (engine uses sorted order). | Same. | — |

**Code list:** `ALL_PROJECT_IDS` in `src/game/cards.ts` — three ids are shuffled from this list each run.

---

## Core systems (starting colony, not in script deck)

These **`id`s** are in `STARTING_BUILDINGS`. They cost **nothing** to have; **Main Terminal** is not clicked.

| `id` | Name | Emoji | Activation | VP | What it does |
| --- | --- | :---: | --- | ---: | --- |
| `main_terminal` | Main Terminal | 🖥️ | Start of cycle | 0 | Each cycle, contributes **4** basic packets to the roll (plus any extras from other effects). Skipped in the start-of-turn building loop so it is not double-processed. |
| `recon_hub` | Recon Hub | 📡 | Click, **2×** / cycle | 0 | Reroll **all selected basic** packets. Sets “Recon Hub used this cycle,” which **blocks `op_herus`**. If exactly **one** basic is selected and **Cyborg Unit** is in colony, gain **+1 basic** packet. |
| `code_lab` | Code Lab | 💻 | Click, **1×** / cycle | 0 | Spend a **pair** of matching values (or pair involving a wild) → **draw a script** from the deck. |
| `exploit_forge` | Exploit Forge | ⚙️ | Click, **1×** / cycle | 0 | Spend **three consecutive** values → add a **preserved Wildcard**. Each wildcard **spent** in that payment triggers **Garbage Collector** (extra basics next cycle). |

---

## Scripts (blueprint queue → colony)

**Deploy:** Pay the **packet cost**, gain **`vpValue` XP** (usually **1**). The card moves to the **colony** (starts **exhausted** for click abilities until next refresh).

**Discard from hand:** Right-click a script in the queue → **+1 M.O.D.** (if **IDS Probe** is deployed, **+2** total). Card goes to **discard**.

### Network infrastructure (`settlement`)

| `id` | Name | Emoji | Deploy cost | VP | Power / effect |
| --- | --- | :---: | --- | ---: | --- |
| `network_node` | Network Node | 🔗 | 4 in a row | 1 | **Start of cycle:** +**1** basic packet. |
| `subnet` | Subnet | 🌐 | 3 in a row | 1 | **Start of even cycles:** +**1** basic packet. |
| `remote_server` | Remote Server | 🗄️ | 5 in a row | 1 | **Start of cycle:** +**2** basic packets. |

### Bots (`drone`)

| `id` | Name | Emoji | Deploy cost | VP | Power / effect |
| --- | --- | :---: | --- | ---: | --- |
| `bot_1` … `bot_6` | Bot v1 … v6 | 🤖 | Three of same face (1…6) | 1 each | **Start of cycle:** +**1 fixed** packet of that bot’s value. |

### Hacking tools (`utility`)

| `id` | Name | Emoji | Deploy cost | VP | Power / effect |
| --- | --- | :---: | --- | ---: | --- |
| `packet_injector` | Packet Injector | 💉 | 1, 2, 3 | 1 | **Click:** Turn a selected **1** into a **Wildcard** (in pool). |
| `data_miner` | Data Miner | ⛏️ | 4, 5, 6 | 1 | **Click:** Spend a **pair** → **preserved Wildcard**; wilds spent feed **Garbage Collector**. |
| `port_scanner` | Port Scanner | 🔍 | 3 of a kind | 1 | **On deploy:** **+2 M.O.D.** **Click:** Flip selected **1↔6**. |
| `sandbox` | Sandbox | 🎯 | 2 pairs in a row | 1 | **Click:** Selected packet **X → 7−X**. |
| `cold_storage` | Cold Storage | 🔐 | 1, 3, 5 | 1 | **Click:** Selected packet → **fixed** and **preserved** (removed from pool into preserved zone). |
| `hash_core_16` | Hash Core (16) | 🔢 | Sum **16** (any count) | 1 | **Click:** **2** selected dice → values redistributed to **two halves** of their **sum** (floor split). |
| `hash_core_20` | Hash Core (20) | 🔢 | Sum **20** | 1 | **Click:** **1** die **≥2** → removed and replaced by **two fixed** dice splitting value (floor / remainder). |
| `hash_core_25` | Hash Core (25) | 🔢 | Sum **25** | 1 | **Click:** **2** dice removed → add two fixed dice using engine rule **`min(sum,6)`** and **`min(first+1,6)`**. |
| `daemon` | Daemon | 👾 | 3 in a row | 1 | **On deploy:** Roll **1** fixed preserved packet. **Click:** Reroll one **basic or fixed** (not wild). With **Cyborg Unit** in colony, also gain **+1 basic** after that reroll. |
| `fork_process` | Fork Process | 🔀 | 5 in a row | 1 | **Click:** **Copy** selected value as a new **fixed** packet in the pool. |
| `quantum_cipher` | Quantum Cipher | 🌀 | 2 pairs in a row | 1 | **Click:** Reroll **all selected basics**; **Cyborg** bonus if exactly one basic selected. |

### Advanced exploits (`advanced`)

| `id` | Name | Emoji | Deploy cost | VP | Power / effect |
| --- | --- | :---: | --- | ---: | --- |
| `replicator_agent` | Replicator Agent | 🦾 | 2 Wild | 1 | **Start of cycle:** +**1 Wildcard** (not preserved). |
| `failsafe_protocol` | Failsafe Protocol | 📦 | 3 of a kind | 1 | **On deploy:** **Preserved Wildcard**. **End of cycle:** If you **deployed nothing** this cycle, another **preserved Wildcard**. |
| `garbage_collector` | Garbage Collector | ♻️ | 3 of a kind | 1 | Whenever you **spend** a wildcard (forge, data miner, operation, etc.), **+N** extra basic packets **next** cycle (**N** = wilds spent that action). |
| `cyborg_unit` | Cyborg Unit | 🤖 | 4 of a kind | 1 | When **Recon Hub**, **Daemon**, or **Quantum Cipher** rerolls **exactly one** packet, gain **+1 basic**. |
| `net_scanner` | Net Scanner | 🔭 | 4 of a kind | 1 | **Start of cycle:** Roll **1** fixed **preserved** packet. |
| `zero_day` | Zero-Day | 🧪 | 3 in a row | 1 | **Start of cycle:** **+1 random fixed** (unpreserved) packet. |
| `honeypot` | Honeypot | 🍯 | 1, 2, 3 | 1 | **Start of cycle:** +**1** basic per **completed operation** (built project count). |
| `dark_tunnel` | Dark Tunnel | 🕳️ | 3 Wild | 1 | **Start of cycle:** **2 Wildcards**. **End of cycle:** **+1 M.O.D.** |

### Passive systems (`passive`)

| `id` | Name | Emoji | Deploy cost | VP | Power / effect |
| --- | --- | :---: | --- | ---: | --- |
| `odd_parity_filter` | Odd Parity Filter | 🧲 | 1, 3, 5 | 1 | Card text: **constraint** on other dice (flavor). **Start of cycle:** random **odd fixed** 1/3/5. |
| `even_parity_filter` | Even Parity Filter | 🧲 | 2, 4, 6 | 1 | Same idea for **even** 2/4/6. |
| `packet_router` | Packet Router | 📶 | 2, 4, 6 | 1 | **Start of cycle:** **+1 M.O.D.** |
| `ids_probe` | IDS Probe | 👁️ | 4, 5, 6 | 1 | **On deploy:** **Draw a script**. **When discarding** a script from hand: **+1 extra M.O.D.** |
| `self_heal_protocol` | Self-Heal Protocol | 🔄 | 4 of a kind | 1 | **End of cycle (before pool wipe):** If **both** `dicePool` and `preservedDice` are **empty**, **+2** basics next cycle. |
| `power_manager` | Power Manager | 🔋 | 4 of a kind | 1 | **End of cycle:** If **total** dice in pool + preserved **≥ 2**, **+2** basics next cycle. |
| `passive_tap` | Passive Tap | ⚡ | 2, 3, 4 | 1 | **Odd cycle:** **+1 M.O.D.** **Even cycle:** **+1 fixed 3**. |
| `arp_spoofer` | ARP Spoofer | 🌊 | 1 and 6 | 1 | **Click 1×/cycle:** Swap values of **two** selected packets. |

> **Note:** Parity “constraints” on the two **Parity Filter** cards are described on the card but **not** enforced by `src/game/engine.ts` (no validation against other dice).

---

## Legacy `id` → current `id` (rename map)

Use this if you grep old logs, branches, or forks.

| Legacy | Current |
| --- | --- |
| `headquarter` | `main_terminal` |
| `command_center` | `recon_hub` |
| `laboratory` | `code_lab` |
| `forge` | `exploit_forge` |
| `settlement` | `network_node` |
| `minor_settlement` | `subnet` |
| `outpost` | `remote_server` |
| `drone_1` … `drone_6` | `bot_1` … `bot_6` |
| `printer_3d` | `packet_injector` |
| `extractor` | `data_miner` |
| `shuttle` | `port_scanner` |
| `training_camp` | `sandbox` |
| `dormant_chamber` | `cold_storage` |
| `reactor_16` / `20` / `25` | `hash_core_16` / `20` / `25` |
| `nanobot` | `daemon` |
| `clone_machine` | `fork_process` |
| `quantum` | `quantum_cipher` |
| `replicant_robot` | `replicator_agent` |
| `backup_plan` | `failsafe_protocol` |
| `recycling` | `garbage_collector` |
| `bionic_robot` | `cyborg_unit` |
| `prospector` | `net_scanner` |
| `prototype` | `zero_day` |
| `tourist_attraction` | `honeypot` |
| `warp_drive` | `dark_tunnel` |
| `monopole_odd` / `monopole_even` | `odd_parity_filter` / `even_parity_filter` |
| `transporter` | `packet_router` |
| `observatory` | `ids_probe` |
| `selfrepair_material` | `self_heal_protocol` |
| `energy_saver` | `power_manager` |
| `solar_panel` | `passive_tap` |
| `gravity_well` | `arp_spoofer` |
| `athena` … `coyolxauhqui` | `op_athena` … `op_coyolx` (see operations table; `quetzalcoatl` → `op_quetzal`) |

---

## Network (connectivity and UI)

| Item | Purpose |
| --- | --- |
| **Vite dev server** (`vite.config.ts`) | `host: "::"`, port **8080**; HMR overlay off. |
| **Google Fonts** (`src/index.css`) | Orbitron + Exo 2 from `fonts.googleapis.com`. |
| **Network background** (`Index.tsx`) | Canvas particles only; no gameplay API. |
| **Game logic** | No `fetch` / REST in `src/game/`. |
| **Playwright** | `playwright.config.ts` — optional `baseURL` override. |

---

## NPM scripts (`package.json`)

| Script | Command |
| --- | --- |
| `dev` | `vite` |
| `build` | `vite build` |
| `build:dev` | `vite build --mode development` |
| `lint` | `eslint .` |
| `preview` | `vite preview` |
| `test` | `vitest run` |
| `test:watch` | `vitest` |

---

## Emoji index (UI / log)

- **Cards:** `emoji` on each `CardDef`; script queue shows **🎲** + cost string (`GameCard.tsx`).
- **Colony:** **⚡ Ready** / **💤 Used**.
- **Dice:** **⚡ Wildcard**, **🔒 Fixed**, **📦 Packet** (`DieComponent.tsx`).
- **Start screen:** 📡 🔗 🔧 🎯.
- **Log:** many symbols in `engine.ts` (draw, cycle, deploy, errors, M.O.D., etc.).

---

## Source files

- `src/game/cards.ts` — definitions, `ALL_PROJECT_IDS`, `STARTING_BUILDINGS`
- `src/game/engine.ts` — costs, timing, special rules
- `src/game/types.ts` — `CostType`, `CardDef`
- `src/components/game/GameCard.tsx` — `costToString`
