import React from 'react';
import { Die as DieType } from '@/game/types';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface DieProps {
  die: DieType;
  selected: boolean;
  onSelect: () => void;
  onExclusiveSelect: () => void;
  onModify?: (delta: number) => void;
  showModButtons?: boolean;
}

const dotPositions: Record<number, string[]> = {
  1: ['top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'],
  2: ['top-2 right-2', 'bottom-2 left-2'],
  3: ['top-2 right-2', 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2', 'bottom-2 left-2'],
  4: ['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'],
  5: ['top-2 left-2', 'top-2 right-2', 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2', 'bottom-2 left-2', 'bottom-2 right-2'],
  6: ['top-2 left-2', 'top-2 right-2', 'top-1/2 left-2 -translate-y-1/2', 'top-1/2 right-2 -translate-y-1/2', 'bottom-2 left-2', 'bottom-2 right-2'],
};

export const DieComponent: React.FC<DieProps> = ({ die, selected, onSelect, onExclusiveSelect, onModify, showModButtons }) => {
  const typeClass = die.type === 'wild' ? 'dice-wild' : die.type === 'fixed' ? 'dice-fixed' : 'dice-basic';
  const typeLabel = die.type === 'wild' ? '⚡ Wildcard' : die.type === 'fixed' ? '🔒 Fixed' : '📦 Packet';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex flex-col items-center gap-1">
          {showModButtons && selected && onModify && (
            <button
              onClick={(e) => { e.stopPropagation(); onModify(1); }}
              className="text-xs px-1.5 py-0.5 rounded bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              +1
            </button>
          )}
          <div
            className={cn(
              'dice-face relative',
              typeClass,
              selected && 'dice-selected',
              die.preserved && 'ring-1 ring-cyber-green'
            )}
            onClick={onSelect}
            onContextMenu={(e) => { e.preventDefault(); onExclusiveSelect(); }}
          >
            {dotPositions[die.value]?.map((pos, i) => (
              <div key={i} className={cn('absolute w-2 h-2 rounded-full', pos, die.type === 'wild' ? 'bg-white' : die.type === 'fixed' ? 'bg-blue-100' : 'bg-gray-700')} />
            ))}
          </div>
          {showModButtons && selected && onModify && (
            <button
              onClick={(e) => { e.stopPropagation(); onModify(-1); }}
              className="text-xs px-1.5 py-0.5 rounded bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              -1
            </button>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{typeLabel} — Value: {die.value}{die.preserved ? ' 🔒 Preserved' : ''}</p>
      </TooltipContent>
    </Tooltip>
  );
};
