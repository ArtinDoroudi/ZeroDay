import React from 'react';
import { CardInstance, CostType } from '@/game/types';
import { CARD_DEFS } from '@/game/cards';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface GameCardProps {
  card: CardInstance;
  onClick?: () => void;
  onRightClick?: () => void;
  isColony?: boolean;
  compact?: boolean;
  /** M.O.D. gained when discarding this script (e.g. 2 if IDS Probe is installed). */
  discardModGain?: number;
}

function costToString(cost: CostType): string {
  switch (cost.kind) {
    case 'none':
      return 'Starting';
    case 'specific':
      return cost.values.join(', ');
    case 'three-in-a-row':
      return '3 in a row';
    case 'four-in-a-row':
      return '4 in a row';
    case 'five-in-a-row':
      return '5 in a row';
    case 'six-in-a-row':
      return '1-2-3-4-5-6';
    case 'three-of-a-kind':
      return '3 of a kind';
    case 'four-of-a-kind':
      return '4 of a kind';
    case 'seven-of-a-kind':
      return '7 of a kind';
    case 'pair':
      return 'A pair';
    case 'wild':
      return `${cost.count} Wild`;
    case 'sum':
      return cost.exactCount ? `Sum=${cost.total} (${cost.exactCount} dice)` : `Sum=${cost.total}`;
    case 'two-pairs-in-a-row':
      return '2 pairs in a row';
    case 'two-sets-four-of-a-kind':
      return '2×4 of a kind';
    case 'two-triples':
      return '2×3 of a kind';
    case 'five-pairs':
      return '5 pairs';
    case 'ten-same-parity':
      return '10 same parity';
    case 'eight-alternating':
      return '8 alt odd/even';
    case 'six-same':
      return `Six ${cost.value}s`;
    default:
      return '?';
  }
}

export const GameCard: React.FC<GameCardProps> = ({
  card,
  onClick,
  onRightClick,
  isColony,
  compact,
  discardModGain = 1,
}) => {
  const def = CARD_DEFS[card.defId];
  if (!def) return null;

  const isReady = isColony && !card.exhausted && def.maxUses > 0;
  const isExhausted = isColony && card.exhausted;
  const isProject = def.category === 'project';
  const isHandScript = !isColony && !isProject && Boolean(onRightClick);
  const modHint = isHandScript ? discardModGain : 1;

  const effectClamp = compact ? 'line-clamp-3' : 'line-clamp-4';

  const cardEl = (
    <div
      className={cn(
        'rounded-lg border-2 p-2 cursor-pointer transition-all duration-200 hover:scale-105 select-none',
        compact ? 'min-w-[100px] max-w-[130px]' : 'min-w-[115px]',
        isProject &&
          cn(
            'max-w-[240px] bg-gradient-to-br from-card to-secondary card-project',
            compact ? 'min-w-[100px]' : 'min-w-[150px]'
          ),
        isReady && 'card-ready',
        isExhausted && 'card-exhausted',
        !isColony && !isProject && 'border-border bg-card hover:border-primary/50',
        isColony && !isReady && !isExhausted && def.maxUses === 0 && 'border-muted-foreground/30 bg-card/60'
      )}
      onClick={onClick}
      onContextMenu={e => {
        e.preventDefault();
        onRightClick?.();
      }}
    >
      <div className="text-center">
        <span className="text-2xl">{def.emoji}</span>
        <p
          className={cn('font-semibold text-xs mt-1 leading-tight', isProject && 'text-sm')}
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          {def.name}
        </p>

        {/* Script queue: deploy cost vs effect */}
        {isHandScript && (
          <>
            <div className="mt-1.5 border-t border-border/70 pt-1.5 text-left space-y-1">
              <p className="text-[9px] font-mono uppercase tracking-wide text-amber-500/95 leading-tight">
                Cost <span className="font-normal normal-case text-amber-200/90">🎲 {costToString(def.cost)}</span>
              </p>
              <p
                className={cn(
                  'text-[9px] text-sky-300/95 leading-snug text-left',
                  effectClamp
                )}
              >
                <span className="font-mono uppercase tracking-wide text-sky-400/80 block mb-0.5">Gives</span>
                {def.description}
              </p>
            </div>
          </>
        )}

        {/* Network / colony: REQ vs GIVES */}
        {isColony && (def.networkReq || def.networkGives) && (
          <div className="mt-1.5 border-t border-border/70 pt-1.5 text-left space-y-1.5">
            {def.networkReq && (
              <p className={cn('text-[9px] text-amber-200/90 leading-snug', effectClamp)}>
                <span className="font-mono uppercase tracking-wide text-amber-500/95 block mb-0.5">REQ</span>
                {def.networkReq}
              </p>
            )}
            {def.networkGives && (
              <p className={cn('text-[9px] text-sky-300/95 leading-snug', effectClamp)}>
                <span className="font-mono uppercase tracking-wide text-sky-400/85 block mb-0.5">GIVES</span>
                {def.networkGives}
              </p>
            )}
          </div>
        )}
        {isColony && !def.networkReq && !def.networkGives && (
          <p className={cn('mt-1.5 border-t border-border/70 pt-1.5 text-[9px] text-muted-foreground text-left leading-snug', effectClamp)}>
            {def.description}
          </p>
        )}

        {isProject && def.description && (
          <p
            className={cn(
              'mt-2 text-left text-muted-foreground leading-relaxed',
              compact ? 'text-[10px] line-clamp-5' : 'text-[12px]'
            )}
          >
            {def.description}
          </p>
        )}

        {isColony && isReady && (
          <span className="text-[9px] text-green-400 inline-block mt-1">⚡ Ready</span>
        )}
        {isColony && isExhausted && (
          <span className="text-[9px] text-muted-foreground inline-block mt-1">💤 Used</span>
        )}
      </div>
    </div>
  );

  if (isProject) return cardEl;

  const tooltipBody = (
    <>
      <p className="font-bold">
        {def.emoji} {def.name}
      </p>
      <p className="text-xs mt-1.5 leading-snug">{def.description}</p>
      {def.tooltipExample && (
        <p className="text-[11px] mt-2 pt-2 border-t border-border/60 text-muted-foreground italic leading-snug">
          <span className="not-italic font-semibold text-foreground/90">Example: </span>
          {def.tooltipExample}
        </p>
      )}
      {!isColony && (
        <p className="text-xs text-muted-foreground mt-2">
          Cost: <span className="text-amber-200/90">{costToString(def.cost)}</span>
        </p>
      )}
      {def.vpValue > 0 && <p className="text-xs text-cyber-cyan mt-0.5">+{def.vpValue} XP on deploy</p>}
      {isHandScript && (
        <p className="text-[11px] mt-2 pt-2 border-t border-destructive/30 text-red-400 font-medium leading-snug">
          Right-click to discard for +{modHint} M.O.D.
        </p>
      )}
    </>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{cardEl}</TooltipTrigger>
      <TooltipContent
        className="max-w-[280px]"
        side="top"
        sideOffset={6}
        avoidCollisions={true}
        collisionPadding={12}
      >
        {tooltipBody}
      </TooltipContent>
    </Tooltip>
  );
};
