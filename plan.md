
# 🎲 Pangu Project — The Dice Game

A solo dice-management strategy game set on Mars, built as a browser-based web app with modern, clean UI and rich visual feedback.

---

## 🎯 Core Game Loop
- **10-round game** with 3 phases per round: Ready → Action → End
- Roll dice, activate buildings, build blueprints, complete projects
- **Win** by building all 3 randomly selected projects within 10 rounds
- **Scoring** system with time bonuses for early completion (target: 40 VP)

---

## 🖥️ Game Interface (5 Zones)

1. **🏘️ Colony Zone** — Built buildings with green (ready) / grey (exhausted) borders. Click to activate.
2. **📐 Blueprint Zone** — Hand cards. Click to build (spending dice). Right-click to discard for M.O.D.
3. **🚀 Project Zone** — 3 large projects to complete. Shows dice cost requirements clearly.
4. **🎲 Dice Pool** — Active dice with left-click select/unselect, right-click exclusive select. Color-coded: white (basic), grey (fixed), yellow (wild).
5. **🔒 Preserve Zone** — Persistent dice that survive round end.
6. **🔧 M.O.D. Counter** — Spend to modify dice ±1. Persists across rounds.

---

## 🃏 Card System (~35+ cards)

### Starting Buildings (4)
- Headquarter, Command Center, Laboratory, Forge

### Blueprint Categories
- **Settlements** — Extra dice generators (Settlement, Minor Settlement, Outpost)
- **Drones** — Fixed dice generators (6 variants, values 1-6)
- **Utility Buildings** — Dice manipulation (3D Printer, Extractor, Shuttle, Training Camp, Dormant Chamber, Reactors, Nanobot, Clone Machine, Quantum)
- **Advanced Generators** — Wild & extra dice (Replicant Robot, Backup Plan, Recycling, Bionic Robot, Prospector, Prototype, Tourist Attraction, Warp Drive)
- **Passive/Special** — Conditional effects (Monopoles, Transporter, Observatory, Energy Saver, Solar Panel, Gravity Well, etc.)

### Projects (12 in pool, 3 per game)
- Athena, Vishnu, Inari, Pangu, Dazbog, Quetzalcoatl, Te Kore, Herus, Hesta, Osiris, Amaterasu, Coyolxauhqui — each with unique dice requirements

---

## 🎮 Interactions & UX

- **Dice selection** — Click to toggle, right-click for exclusive select. Visual glow on selected dice.
- **Building activation** — Select dice, then click a green-bordered building. Animated transitions.
- **Blueprint building** — Select matching dice, click blueprint card. Card animates to Colony.
- **M.O.D. modification** — Click ±1 buttons on selected die. Free for wild dice.
- **Discard for M.O.D.** — Right-click blueprint in hand.
- **Dice wrapping** — 6→1 and 1→6 when modifying.
- **End turn** — Pass button to trigger end phase.

---

## 🎨 Visual Design

- **Modern dark theme** with Mars-inspired warm accents (deep reds, amber, dark slate backgrounds)
- **Card design** — Clean cards with icons, cost indicators as dice symbols, and clear ability text
- **Dice** — 3D-styled dice faces with smooth roll animations
- **Emoji/Icons** throughout: 🎲 dice, 🔧 M.O.D., 🏗️ build, ⚡ activate, 🚀 projects, 🏘️ colony
- **Responsive layout** optimized for desktop play
- **Round tracker** — Visual progress bar showing current round / 10
- **Score display** — Running VP total with breakdown tooltip
- **Tooltips** on all cards explaining abilities
- **Animations** — Dice rolling, card transitions, building glow effects

---

## 🔄 Game Flow Screens

1. **Start Screen** — Title, "New Game" button, brief rules summary
2. **Game Board** — Main play area with all 6 zones
3. **Game Over** — Win/Lose screen with score breakdown and "Play Again"

---

## 📦 State Management
- All game state managed client-side with React state (no backend needed)
- Game logic engine handling all card effects, dice rules, and win/lose conditions
- Deck shuffling, random project selection, dice rolling all client-side

