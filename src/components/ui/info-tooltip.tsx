/**
 * InfoTooltip - A small info icon with a hover tooltip
 * Use next to labels, headings, or complex fields to explain what they mean
 */

import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface InfoTooltipProps {
  /** The tooltip text */
  content: string;
  /** Optional side placement */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Icon size variant */
  size?: 'sm' | 'md';
  /** Additional className for the icon */
  className?: string;
}

export function InfoTooltip({ content, side = 'top', size = 'sm', className }: InfoTooltipProps) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              'inline-flex items-center justify-center text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-help',
              className
            )}
            tabIndex={-1}
          >
            <Info className={iconSize} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-[360px] text-xs leading-relaxed z-[100] bg-popover border border-border shadow-lg"
        >
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
