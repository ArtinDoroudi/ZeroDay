import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { GameState, GameMode, FIREWALL_MIN_XP } from '@/game/types';
import {
  initGame, startReadyPhase, toggleDieSelection, exclusiveSelectDie,
  modifyDie, activateBuilding, buildCard, discardForMod, endTurn, resetHand
} from '@/game/engine';
import { CARD_DEFS } from '@/game/cards';
import { DieComponent } from '@/components/game/DieComponent';
import { GameCard } from '@/components/game/GameCard';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  playSoundAfterTransition,
  resumeGameAudio,
  playUiConfirm,
  getGameSfxMuted,
  setGameSfxMuted,
} from '@/lib/gameSounds';
import { Volume2, VolumeX } from 'lucide-react';

/** Newest cycle first; lines keep chronological order within each cycle. */
function buildLogForDisplay(log: string[]): { key: number; text: string }[] {
  const groups: { key: number; text: string }[][] = [];
  let current: { key: number; text: string }[] = [];
  log.forEach((text, origIdx) => {
    const isCycleHeader = text.trimStart().startsWith('━');
    if (isCycleHeader) {
      if (current.length > 0) groups.push(current);
      current = [{ key: origIdx, text }];
    } else {
      current.push({ key: origIdx, text });
    }
  });
  if (current.length > 0) groups.push(current);
  return groups.reverse().flat();
}

// ─── Animated network particle background ─────────────────────────────────────
const NetworkBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const COUNT = 60;
    const CONNECT_DIST = 135;

    interface Particle {
      x: number; y: number;
      vx: number; vy: number;
      r: number; phase: number;
    }

    const particles: Particle[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.32,
      vy: (Math.random() - 0.5) * 0.32,
      r: Math.random() * 1.4 + 0.7,
      phase: Math.random() * Math.PI * 2,
    }));

    let animId: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.phase += 0.014;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      }

      for (let i = 0; i < COUNT; i++) {
        for (let j = i + 1; j < COUNT; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) {
            const alpha = (1 - dist / CONNECT_DIST) * 0.18;
            ctx.strokeStyle = `rgba(34, 197, 94, ${alpha})`;
            ctx.lineWidth = 0.55;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        const glow = (Math.sin(p.phase) + 1) / 2;
        const alpha = 0.3 + glow * 0.5;
        const r = p.r + glow * 1.1;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 6);
        grad.addColorStop(0, `rgba(34, 197, 94, ${alpha * 0.22})`);
        grad.addColorStop(1, 'rgba(34, 197, 94, 0)');
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 6, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.65 }}
    />
  );
};

// ─── How to Play modal ────────────────────────────────────────────────────────
type HowToTab = 'general' | 'packets' | 'scoring' | 'controls';

const HOW_TO_TABS: { id: HowToTab; label: string }[] = [
  { id: 'general', label: 'Overview' },
  { id: 'packets', label: 'Packets' },
  { id: 'scoring', label: 'Scoring' },
  { id: 'controls', label: 'Controls' },
];

const HowToPlayModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [tab, setTab] = useState<HowToTab>('general');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-to-title"
        className="flex max-h-[min(32rem,100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-none border border-border bg-card shadow-[0_24px_48px_-12px_rgba(0,0,0,0.65)] sm:rounded-xl sm:max-h-[min(32rem,85vh)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 id="how-to-title" className="text-lg font-semibold tracking-tight text-foreground">
            How to play
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <span className="text-xl leading-none" aria-hidden>
              ×
            </span>
          </button>
        </div>

        <div className="flex shrink-0 flex-wrap gap-x-6 gap-y-1 border-b border-border px-5">
          {HOW_TO_TABS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                '-mb-px border-b-2 py-3 text-sm font-medium transition-colors',
                tab === t.id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="max-h-[min(22rem,calc(85vh-9.5rem))] overflow-y-auto overscroll-contain">
          <div className="px-5 py-4 pr-2">
            {tab === 'general' && (
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                <p>
                  Your{' '}
                  <span className="font-medium text-primary">Main Terminal</span> deploys four basic packets every
                  cycle. That pool is what you spend for almost everything.
                </p>
                <p>
                  Spend packets to{' '}
                  <span className="font-medium text-primary">activate network nodes</span> or{' '}
                  <span className="font-medium text-primary">deploy scripts</span> from your queue so your setup gets
                  stronger each cycle.
                </p>
                <p>
                  <span className="font-medium text-primary">M.O.D.</span> tokens nudge a packet by ±1 (6 and 1 wrap).
                  Use them when you are one pip short of a combo.
                </p>
                <p>
                  Finish all{' '}
                  <span className="font-medium text-primary">three Operations</span> before cycle 10. Clearing them
                  earlier earns bonus score.
                </p>
                <p className="border-t border-border pt-4 text-xs text-muted-foreground/90">
                  Most turns are a trade-off between powering the board now and setting up a bigger payout later.
                </p>
              </div>
            )}

            {tab === 'packets' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Three packet types show up in the pool. The swatches match what you see in-game.
                </p>
                <div className="space-y-3">
                  {[
                    {
                      swatch: 'linear-gradient(135deg, #d1d5db, #9ca3af)',
                      name: 'Basic',
                      desc: 'Rolled from your Main Terminal each cycle. Reroll-friendly.',
                    },
                    {
                      swatch: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                      name: 'Fixed',
                      desc: 'Produced by nodes. Value stays put unless you invest hard into changing it.',
                    },
                    {
                      swatch: 'linear-gradient(135deg, hsl(152 100% 38%), hsl(145 90% 26%))',
                      name: 'Wildcard',
                      desc: 'Counts as any value. Does not cost M.O.D. to assign, and can stick around if preserved.',
                    },
                  ].map(({ swatch, name, desc }) => (
                    <div
                      key={name}
                      className="flex gap-3 rounded-lg border border-border/80 bg-muted/20 p-3"
                    >
                      <div
                        className="mt-0.5 h-10 w-10 shrink-0 rounded-md border border-white/10"
                        style={{ background: swatch }}
                        aria-hidden
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">{name}</p>
                        <p className="mt-1 text-sm leading-snug text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground border-t border-border pt-4">
                  Packets you mark as preserved survive the end of the cycle.
                </p>
              </div>
            )}

            {tab === 'scoring' && (
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                <p>
                  Your run <span className="font-medium text-foreground">XP</span> is the total of everything below.
                  You&apos;ll see the same number on the HUD during play and on the game-over screen.
                </p>
                <div className="rounded-lg border border-border/80 bg-muted/20 p-3 space-y-2">
                  <p className="font-medium text-foreground">Deploying scripts</p>
                  <p>
                    Each script you install from your queue adds that card&apos;s XP value. Almost every script is{' '}
                    <span className="font-medium text-primary">+1 XP</span>. Core terminal nodes (Main Terminal, Recon
                    Hub, and similar) are worth 0 when placed.
                  </p>
                </div>
                <div className="rounded-lg border border-border/80 bg-muted/20 p-3 space-y-2">
                  <p className="font-medium text-foreground">Executing Operations</p>
                  <p>
                    When you complete an Operation, you earn{' '}
                    <span className="font-medium text-primary">base XP</span> (always{' '}
                    <span className="font-medium text-foreground">1</span> per Operation){' '}
                    <span className="font-medium text-foreground">plus a time bonus</span> based on{' '}
                    <span className="font-medium text-primary">which cycle</span> you execute it on.
                  </p>
                  <p className="font-mono text-xs text-foreground/90 bg-background/60 rounded-md px-2.5 py-2 border border-border/60">
                    time bonus = 3 × (11 − current cycle)
                  </p>
                  <p>
                    The <span className="font-medium text-foreground">current cycle</span> is the one showing in the log
                    header when you execute (Cycle 1, Cycle 2, …). Finishing Operations earlier multiplies your payout:
                    for example, on cycle 1 the bonus is <span className="font-medium text-foreground">30 XP</span>{' '}
                    (3 × 10), on cycle 9 it is <span className="font-medium text-foreground">6 XP</span>{' '}
                    (3 × 2), and on cycle 10 it is <span className="font-medium text-foreground">3 XP</span>{' '}
                    (3 × 1).
                  </p>
                  <p className="text-xs text-muted-foreground/90 pt-1 border-t border-border/60">
                    Operation XP is added the moment you execute; your total score is not recomputed from cards
                    afterward, so the time bonus is locked in when you clear each Operation.
                  </p>
                </div>
              </div>
            )}

            {tab === 'controls' && (
              <ul className="space-y-0 divide-y divide-border/60 text-sm m-0 p-0 list-none">
                {[
                  ['Tap / click packet', 'Toggle whether it is selected.'],
                  ['Right-click or long-press packet', 'Select only that packet.'],
                  ['+1 / −1 (next to a packet)', 'Spend M.O.D. to shift its value.'],
                  ['Tap a network node', 'Use its ability with the packets you have selected.'],
                  ['Tap a script', 'Deploy it; spends the shown packet cost.'],
                  ['Right-click or long-press a script', 'Discard it for M.O.D. (see queue bonus on board).'],
                  ['Tap an Operation', 'Execute it when your selection matches the cost.'],
                ].map(([label, detail]) => (
                  <li key={label} className="flex flex-col gap-0.5 py-3 first:pt-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                    <span className="shrink-0 font-medium text-foreground">{label}</span>
                    <span className="text-muted-foreground sm:text-right">{detail}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Start Screen ─────────────────────────────────────────────────────────────
const START_SUMMARY_LINES = [
  { icon: '📡', title: 'Deploy', desc: 'Roll packets each cycle to fuel your network' },
  { icon: '🔗', title: 'Build', desc: 'Install scripts to expand your capabilities' },
  { icon: '🔧', title: 'Exploit', desc: 'Tune packet values with M.O.D. tokens (±1)' },
  { icon: '🎯', title: 'Execute', desc: 'Complete Operations — win condition depends on mode below' },
];

const MODE_OPTIONS: { id: GameMode; title: string; blurb: string }[] = [
  {
    id: 'script_kiddie',
    title: 'Script Kiddie',
    blurb: 'Complete 3 operations in 10 rounds.',
  },
  {
    id: 'firewall_breach',
    title: 'Firewall Breach',
    blurb: `Reach ${FIREWALL_MIN_XP}+ XP and complete 3 operations in 10 rounds.`,
  },
];

const StartScreen: React.FC<{ onStart: (mode: GameMode) => void }> = ({ onStart }) => {
  const [showHowTo, setShowHowTo] = useState(false);
  const [selectedMode, setSelectedMode] = useState<GameMode>('script_kiddie');

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center gap-6 overflow-hidden p-4 py-[max(1.5rem,env(safe-area-inset-top,0px))] sm:gap-7 sm:p-6">
      <NetworkBackground />

      {/* ── Title ── */}
      <div className="relative z-10 text-center">
        <p className="text-[9px] tracking-[0.55em] text-muted-foreground/70 uppercase mb-4">
          ▸ CLASSIFIED OPERATION ◂
        </p>
        <h1
          className="font-black tracking-tight leading-none"
          style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'clamp(3.5rem, 10vw, 6rem)' }}
        >
          <span className="zero-text-gradient">ZERO</span>
          <span className="text-muted-foreground/35">.</span>
          <span className="text-white">DAY</span>
        </h1>
        <p className="text-muted-foreground mt-3 text-sm">
          A solo hacker dice-management game
        </p>
      </div>

      {/* ── Single summary panel (same copy as before, one surface) ── */}
      <div className="relative z-10 w-full max-w-md rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm px-4 py-4">
        <ul className="space-y-3 text-sm text-muted-foreground m-0 p-0 list-none">
          {START_SUMMARY_LINES.map(({ icon, title, desc }) => (
            <li key={title} className="flex gap-3 leading-snug">
              <span className="shrink-0 text-base opacity-90" aria-hidden>
                {icon}
              </span>
              <span>
                <span className="font-semibold text-foreground">{title}</span>
                <span className="text-muted-foreground"> — {desc}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Game mode ── */}
      <div className="relative z-10 w-full max-w-md space-y-2">
        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground/80">
          Select mode
        </p>
        <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
          {MODE_OPTIONS.map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelectedMode(opt.id)}
              className={cn(
                'rounded-xl border px-3 py-3 text-left transition-colors',
                selectedMode === opt.id
                  ? 'border-primary bg-primary/12 shadow-[0_0_0_1px_hsl(var(--primary)/0.35)]'
                  : 'border-border/60 bg-card/30 hover:border-border hover:bg-card/45'
              )}
            >
              <span className="block text-sm font-semibold text-foreground" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {opt.title}
              </span>
              <span className="mt-1 block text-xs leading-snug text-muted-foreground">{opt.blurb}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div className="relative z-10 flex flex-col items-center gap-2 w-full max-w-xs">
        <button
          type="button"
          onClick={() => onStart(selectedMode)}
          className="w-full py-3.5 rounded-xl text-base font-semibold bg-primary text-primary-foreground transition-opacity hover:opacity-90 active:opacity-85"
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          ▶ INITIALIZE
        </button>
        <button
          type="button"
          onClick={() => setShowHowTo(true)}
          className="w-full rounded-xl border border-border bg-white/[0.04] py-2.5 text-sm font-medium text-foreground/90 transition-colors hover:border-primary/45 hover:bg-white/[0.07]"
        >
          How to play
        </button>
      </div>

      {showHowTo && <HowToPlayModal onClose={() => setShowHowTo(false)} />}
    </div>
  );
};

// ─── Game Over Screen ─────────────────────────────────────────────────────────
const GameOverScreen: React.FC<{ state: GameState; onRestart: () => void }> = ({ state, onRestart }) => {
  const winSubtitle =
    state.gameMode === 'firewall_breach'
      ? `Firewall breached — ${FIREWALL_MIN_XP}+ XP and all operations complete.`
      : 'All operations executed successfully.';
  const loseSubtitle =
    state.gameMode === 'firewall_breach'
      ? state.projects.length > 0
        ? 'Breach failed — finish all operations and reach the XP threshold before cycle 10 ends.'
        : `Breach failed — need ${FIREWALL_MIN_XP}+ XP (have ${state.score}).`
      : 'Operations remain unexecuted...';

  return (
  <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-6 p-4 sm:gap-8 sm:p-8">
    <div className="text-center space-y-3 sm:space-y-4 px-1">
      {state.gameResult === 'win' ? (
        <>
          <h1
            className="text-2xl font-black leading-tight text-primary sm:text-5xl"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            🎉 ACCESS GRANTED
          </h1>
          <p className="text-sm text-foreground font-mono sm:text-xl">{winSubtitle}</p>
        </>
      ) : (
        <>
          <h1
            className="text-2xl font-black leading-tight text-destructive sm:text-5xl"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            💀 CONNECTION LOST
          </h1>
          <p className="text-sm text-foreground font-mono sm:text-xl">{loseSubtitle}</p>
        </>
      )}
      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
        {state.gameMode === 'firewall_breach' ? 'Firewall Breach' : 'Script Kiddie'}
      </p>
      <p className="text-xl font-bold text-primary sm:text-3xl" style={{ fontFamily: 'Orbitron, sans-serif' }}>
        Score: {state.score} XP
      </p>
      {state.gameResult === 'win' && state.gameMode === 'script_kiddie' && state.score >= FIREWALL_MIN_XP && (
        <p className="text-lg text-green-400 font-mono">⭐ Elite Hacker Achievement! (40+ XP)</p>
      )}
      {state.gameResult === 'win' && state.gameMode === 'firewall_breach' && (
        <p className="text-lg text-green-400 font-mono">⭐ Firewall Breach objective complete</p>
      )}
    </div>
    <div className="game-zone max-w-sm w-full space-y-2 px-1">
      <h3 className="font-semibold text-sm font-mono" style={{ fontFamily: 'Orbitron, sans-serif' }}>
        <span className="text-primary">{'>'}</span> Score Breakdown
      </h3>
      {state.builtProjects.map(c => {
        const def = CARD_DEFS[c.defId];
        return <p key={c.instanceId} className="text-xs text-muted-foreground font-mono">{def.emoji} {def.name} — executed</p>;
      })}
      {state.colony.filter(c => CARD_DEFS[c.defId].vpValue > 0).map(c => {
        const def = CARD_DEFS[c.defId];
        return <p key={c.instanceId} className="text-xs text-muted-foreground font-mono">{def.emoji} {def.name} — +{def.vpValue} XP</p>;
      })}
    </div>
    <Button size="lg" onClick={onRestart} className="font-mono" style={{ fontFamily: 'Orbitron, sans-serif' }}>
      🔄 REINITIALIZE
    </Button>
  </div>
  );
};

// ─── Game Board ───────────────────────────────────────────────────────────────
const GameBoard: React.FC<{ state: GameState; dispatch: (fn: (s: GameState) => GameState) => void }> = ({ state, dispatch }) => {
  const [showHowTo, setShowHowTo] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(getGameSfxMuted);
  const logRef = React.useRef<HTMLDivElement>(null);
  const logLines = useMemo(() => buildLogForDisplay(state.log), [state.log]);

  React.useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = 0;
  }, [state.log]);

  const scriptDiscardModGain = state.colony.some(c => c.defId === 'ids_probe') ? 2 : 1;

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col gap-2 overflow-hidden p-2 pt-[max(0.5rem,env(safe-area-inset-top,0px))] pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
      {/* Top Bar */}
      <div
        className="game-zone flex shrink-0 flex-col gap-2 px-2 py-2 sm:flex-row sm:items-center sm:gap-3 sm:px-3"
        style={{ borderColor: 'hsl(var(--primary) / 0.18)' }}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 sm:flex-1 sm:gap-x-4">
          <div className="flex min-w-0 shrink-0 flex-col gap-0.5">
            <h2 className="text-sm font-bold font-mono leading-tight" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              <span className="zero-text-gradient">ZERO</span><span className="text-muted-foreground/30">.</span>DAY
            </h2>
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              {state.gameMode === 'firewall_breach'
                ? `Firewall Breach · ${FIREWALL_MIN_XP}+ XP`
                : 'Script Kiddie'}
            </span>
          </div>
          <div className="flex min-w-0 shrink-0 items-center gap-2 text-xs font-mono">
            <span className="whitespace-nowrap">🔄 {state.round}/{state.maxRounds}</span>
            <Progress value={(state.round / state.maxRounds) * 100} className="h-2 w-14 sm:w-20" />
          </div>
          <span className="shrink-0 text-xs font-mono font-bold text-primary">⭐ {state.score} XP</span>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-center sm:px-2">
          <button
            type="button"
            onClick={() => dispatch(s => resetHand(s))}
            title="Start over like a new game: new operations, script queue, and packets (same mode)."
            className="rounded-lg border border-border/80 bg-muted/25 px-2.5 py-2 text-[11px] font-semibold tracking-wide text-foreground/90 transition-all hover:border-primary/45 hover:bg-muted/40 sm:px-3 sm:text-xs"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            🔁 NEW RUN
          </button>
          <button
            type="button"
            onClick={() => setShowHowTo(true)}
            className="min-w-0 rounded-lg border border-primary/40 bg-primary/8 px-3 py-2 text-[11px] font-semibold tracking-wide text-foreground/95 shadow-[0_0_20px_-8px_hsl(var(--primary))] transition-all hover:border-primary/65 hover:bg-primary/14 hover:shadow-[0_0_28px_-10px_hsl(var(--primary))] active:scale-[0.98] sm:min-w-[10.5rem] sm:px-5 sm:text-xs"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            <span className="sm:hidden">HELP</span>
            <span className="hidden sm:inline">HOW TO PLAY</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const next = !sfxMuted;
              setSfxMuted(next);
              setGameSfxMuted(next);
            }}
            title={sfxMuted ? 'Unmute sound effects' : 'Mute sound effects'}
            aria-label={sfxMuted ? 'Unmute sound effects' : 'Mute sound effects'}
            aria-pressed={sfxMuted}
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-foreground/90 transition-all hover:border-primary/45 hover:bg-muted/40 active:scale-[0.96]',
              sfxMuted ? 'border-border/80 bg-muted/20 text-muted-foreground' : 'border-border/80 bg-muted/25'
            )}
          >
            {sfxMuted ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
          </button>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono sm:flex-1 sm:justify-end sm:gap-x-4">
          <span className="shrink-0 font-bold text-green-400">🔧 {state.mod} M.O.D.</span>
          <span className="shrink-0 text-muted-foreground">📚 Queue: {state.deck.length}</span>
        </div>
      </div>

      {/* Main: stack on narrow viewports (log + end cycle on top); side panel from lg */}
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden lg:flex-row lg:items-stretch">
        {/* Sidebar: end cycle + log — first on mobile for quick access */}
        <div className="order-1 flex max-h-[min(42vh,19rem)] min-h-0 w-full shrink-0 flex-col gap-2 overflow-hidden lg:order-2 lg:max-h-none lg:w-[360px] lg:max-w-[360px] lg:shrink-0">
          <div className="game-zone shrink-0">
            <button
              className="w-full rounded-lg py-2.5 text-xs font-black tracking-widest transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 sm:py-3 sm:text-sm"
              style={{
                fontFamily: 'Orbitron, sans-serif',
                background: state.phase === 'action' ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.1)',
                color: state.phase === 'action' ? 'hsl(var(--primary-foreground))' : 'rgba(255,255,255,0.3)',
              }}
              onClick={() => dispatch(endTurn)}
              disabled={state.phase !== 'action'}
            >
              ⏭ END CYCLE
            </button>
          </div>
          <div className="game-zone flex min-h-0 flex-1 flex-col overflow-hidden">
            <h3 className="mb-2 shrink-0 text-xs font-bold text-muted-foreground font-mono" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              📟 SYSTEM LOG
            </h3>
            <div
              ref={logRef}
              className="min-h-0 w-full min-w-0 flex-1 overflow-y-auto overscroll-contain pr-1 text-xs leading-relaxed text-muted-foreground font-mono"
            >
              <div className="flex w-full min-w-0 flex-col gap-0.5 pb-1">
                {logLines.map(({ key, text }) => {
                  const line = text.trimStart();
                  const isCycle = line.startsWith('━');
                  return (
                    <p
                      key={key}
                      className={cn(
                        'w-full min-w-0 max-w-full',
                        isCycle && 'mb-1 border-b border-border/50 pb-1.5 text-primary font-bold',
                        !isCycle && 'break-words'
                      )}
                    >
                      {line}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Game zones — scroll */}
        <div className="order-2 flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain lg:order-1">
          {/* Operations */}
          <div className="game-zone" style={{ borderColor: 'rgba(168,85,247,0.2)' }}>
            <h3 className="text-xs font-bold mb-2 text-purple-400/80 font-mono" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              🎯 OPERATIONS ({state.builtProjects.length}/3 executed)
            </h3>
            <div className="flex gap-2 flex-wrap">
              {state.projects.map(card => (
                <GameCard
                  key={card.instanceId}
                  card={card}
                  onClick={() => dispatch(s => buildCard(s, card.instanceId, true))}
                />
              ))}
              {state.builtProjects.map(card => (
                <div key={card.instanceId} className="opacity-50">
                  <GameCard card={card} compact />
                </div>
              ))}
            </div>
          </div>

          {/* Network */}
          <div className="game-zone flex-1" style={{ borderColor: 'rgba(65,105,255,0.2)' }}>
            <h3 className="text-xs font-bold mb-2 text-blue-400/80 font-mono" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              🌐 NETWORK
            </h3>
            <div className="flex gap-2 flex-wrap">
              {state.colony.map(card => (
                <GameCard
                  key={card.instanceId}
                  card={card}
                  isColony
                  compact
                  onClick={() => dispatch(s => activateBuilding(s, card.instanceId))}
                />
              ))}
            </div>
          </div>

          {/* Packet Pool */}
          <div className="game-zone" style={{ borderColor: 'hsl(var(--primary) / 0.2)' }}>
            <div className="flex items-center justify-between mb-2">
              <h3
                className="text-xs font-bold text-primary/85 font-mono"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                🎲 PACKET POOL ({state.dicePool.length})
              </h3>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-6 font-mono"
                onClick={() => dispatch(s => ({ ...s, selectedDiceIds: [] }))}
              >
                Clear Selection
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap min-h-[80px]">
              {state.dicePool.map(die => (
                <DieComponent
                  key={die.id}
                  die={die}
                  selected={state.selectedDiceIds.includes(die.id)}
                  onSelect={() => dispatch(s => toggleDieSelection(s, die.id))}
                  onExclusiveSelect={() => dispatch(s => exclusiveSelectDie(s, die.id))}
                  onModify={(delta) => dispatch(s => modifyDie(s, die.id, delta))}
                  showModButtons
                />
              ))}
              {state.dicePool.length === 0 && (
                <p className="text-xs text-muted-foreground italic font-mono">No packets in pool</p>
              )}
            </div>
          </div>

          {/* Cached + Scripts row */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="game-zone">
              <h3 className="text-xs font-bold mb-2 text-green-400/70 font-mono" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                🔒 CACHED ({state.preservedDice.length})
              </h3>
              <div className="flex gap-2 flex-wrap min-h-[65px]">
                {state.preservedDice.map(die => (
                  <DieComponent
                    key={die.id}
                    die={die}
                    selected={state.selectedDiceIds.includes(die.id)}
                    onSelect={() => dispatch(s => toggleDieSelection(s, die.id))}
                    onExclusiveSelect={() => dispatch(s => exclusiveSelectDie(s, die.id))}
                    onModify={(delta) => dispatch(s => modifyDie(s, die.id, delta))}
                    showModButtons
                  />
                ))}
                {state.preservedDice.length === 0 && (
                  <p className="text-xs text-muted-foreground italic font-mono">No cached packets</p>
                )}
              </div>
            </div>

            <div className="game-zone">
              <h3 className="text-xs font-bold mb-2 text-muted-foreground font-mono" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                💾 SCRIPTS ({state.hand.length})
                <span className="mt-0.5 block text-[9px] font-normal text-muted-foreground/50 sm:mt-0 sm:ml-1 sm:inline">
                  Long-press or right-click → discard for M.O.D.
                </span>
              </h3>
              <div className="flex gap-2 flex-wrap min-h-[65px]">
                {state.hand.map(card => (
                  <GameCard
                    key={card.instanceId}
                    card={card}
                    compact
                    discardModGain={scriptDiscardModGain}
                    onClick={() => dispatch(s => buildCard(s, card.instanceId, false))}
                    onRightClick={() => dispatch(s => discardForMod(s, card.instanceId))}
                  />
                ))}
                {state.hand.length === 0 && (
                  <p className="text-xs text-muted-foreground italic font-mono">No scripts loaded</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showHowTo && <HowToPlayModal onClose={() => setShowHowTo(false)} />}
    </div>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────
const GamePage: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(initGame());

  useEffect(() => {
    const unlock = () => resumeGameAudio();
    window.addEventListener('pointerdown', unlock, { passive: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  const startGame = useCallback((mode: GameMode) => {
    resumeGameAudio();
    playUiConfirm();
    setGameState(startReadyPhase(initGame(mode)));
  }, []);

  const dispatch = useCallback((fn: (s: GameState) => GameState) => {
    setGameState(prev => {
      const next = fn(prev);
      playSoundAfterTransition(prev, next);
      return next;
    });
  }, []);

  if (gameState.phase === 'start') return <StartScreen onStart={startGame} />;
  if (gameState.phase === 'game-over') {
    return <GameOverScreen state={gameState} onRestart={() => startGame(gameState.gameMode)} />;
  }
  return <GameBoard state={gameState} dispatch={dispatch} />;
};

export default GamePage;
